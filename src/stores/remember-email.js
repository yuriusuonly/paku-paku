/**
 * Remembered-email encryption helpers (Web Crypto + IndexedDB).
 * @module stores/remember-email
 */

import { decryptAesGcm } from "../shared/cipher/decrypt.js";
import { encryptAesGcm } from "../shared/cipher/encrypt.js";

const DB_NAME = "paku-paku";
const DB_VERSION = 1;
const STORE_NAME = "remember-email";
const KEY_RECORD = "key";
const EMAIL_RECORD = "value";

/**
 * Opens the IndexedDB database for remembered-email storage.
 *
 * @returns {Promise<IDBDatabase | null>} Database instance or null when unavailable.
 */
function openDatabase() {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Runs a transaction on the remember-email object store.
 *
 * @template T
 * @param {"readonly" | "readwrite"} mode - Transaction mode.
 * @param {(store: IDBObjectStore) => IDBRequest<T> | void} operation - Store operation.
 * @returns {Promise<T | undefined>} Request result.
 */
async function withStore(mode, operation) {
  const db = await openDatabase();
  if (!db) return undefined;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      const request = operation(store);
      tx.oncomplete = () => {
        db.close();
        resolve(request ? request.result : undefined);
      };
      tx.onerror = () => {
        db.close();
        resolve(undefined);
      };
      tx.onabort = () => {
        db.close();
        resolve(undefined);
      };
    } catch {
      db.close();
      resolve(undefined);
    }
  });
}

/**
 * Gets or creates the AES-GCM key used for remembered-email encryption.
 *
 * @returns {Promise<CryptoKey | null>} Crypto key or null when unavailable.
 */
async function getOrCreateKey() {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return null;

  const existing = await withStore("readonly", (store) => store.get(KEY_RECORD));
  if (existing) {
    try {
      const raw = existing instanceof Uint8Array ? existing : new Uint8Array(existing);
      return await subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
    } catch {
      await withStore("readwrite", (store) => {
        store.delete(KEY_RECORD);
        store.delete(EMAIL_RECORD);
      });
    }
  }

  try {
    const raw = globalThis.crypto.getRandomValues(new Uint8Array(32));
    const key = await subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
    await withStore("readwrite", (store) => store.put(raw, KEY_RECORD));
    return key;
  } catch {
    return null;
  }
}

/**
 * Saves a remembered email encrypted in IndexedDB.
 *
 * @param {string} email - Email address to remember.
 * @returns {Promise<void>}
 */
export async function saveRememberedEmail(email) {
  const value = String(email || "").trim().toLowerCase();
  if (!value) {
    await clearRememberedEmail();
    return;
  }
  try {
    const key = await getOrCreateKey();
    if (!key) return;
    const payload = await encryptAesGcm(value, key);
    await withStore("readwrite", (store) => store.put({ v: 1, ...payload }, EMAIL_RECORD));
  } catch {
    await withStore("readwrite", (store) => store.delete(EMAIL_RECORD));
  }
}

/**
 * Loads and decrypts the remembered email from IndexedDB.
 *
 * @returns {Promise<string>} Remembered email or empty string.
 */
export async function loadRememberedEmail() {
  try {
    const stored = await withStore("readonly", (store) => store.get(EMAIL_RECORD));
    if (!stored?.ciphertext || !stored?.iv) return "";
    const key = await getOrCreateKey();
    if (!key) return "";
    const email = await decryptAesGcm({ ciphertext: stored.ciphertext, iv: stored.iv }, key);
    return typeof email === "string" ? email : "";
  } catch {
    await withStore("readwrite", (store) => store.delete(EMAIL_RECORD));
    return "";
  }
}

/**
 * Clears the remembered email from IndexedDB.
 *
 * @returns {Promise<void>}
 */
export async function clearRememberedEmail() {
  await withStore("readwrite", (store) => store.delete(EMAIL_RECORD));
}
