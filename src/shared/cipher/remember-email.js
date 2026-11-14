/**
 * Remembered-email encryption helpers (Web Crypto + localStorage).
 * @module shared/cipher/remember-email
 */

import { decodeBase64Url } from "./decode.js";
import { encodeBase64Url } from "./encode.js";
import { decryptAesGcm } from "./decrypt.js";
import { encryptAesGcm } from "./encrypt.js";

const KEY_STORAGE_KEY = "paku-paku.remember-email.key";
const EMAIL_STORAGE_KEY = "paku-paku.remember-email.value";

function toBase64UrlBytes(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const base64 = typeof btoa === "function" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64UrlBytes(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = typeof atob === "function" ? atob(base64) : Buffer.from(base64, "base64").toString("binary");
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function getOrCreateKey() {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle || typeof window === "undefined" || !window.localStorage) return null;

  const existing = window.localStorage.getItem(KEY_STORAGE_KEY);
  if (existing) {
    try {
      const raw = fromBase64UrlBytes(existing);
      return await subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
    } catch {
      window.localStorage.removeItem(KEY_STORAGE_KEY);
      window.localStorage.removeItem(EMAIL_STORAGE_KEY);
    }
  }

  const raw = globalThis.crypto.getRandomValues(new Uint8Array(32));
  const key = await subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
  window.localStorage.setItem(KEY_STORAGE_KEY, toBase64UrlBytes(raw));
  return key;
}

/**
 * Saves a remembered email encrypted in localStorage.
 *
 * @param {string} email - Email address to remember.
 * @returns {Promise<void>}
 */
export async function saveRememberedEmail(email) {
  if (typeof window === "undefined" || !window.localStorage) return;
  const value = String(email || "").trim().toLowerCase();
  if (!value) {
    window.localStorage.removeItem(EMAIL_STORAGE_KEY);
    return;
  }
  try {
    const key = await getOrCreateKey();
    if (!key) return;
    const payload = await encryptAesGcm(value, key);
    window.localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify({ v: 1, ...payload }));
  } catch {
    window.localStorage.removeItem(EMAIL_STORAGE_KEY);
  }
}

/**
 * Loads and decrypts the remembered email from localStorage.
 *
 * @returns {Promise<string>} Remembered email or empty string.
 */
export async function loadRememberedEmail() {
  if (typeof window === "undefined" || !window.localStorage) return "";
  const raw = window.localStorage.getItem(EMAIL_STORAGE_KEY);
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.ciphertext || !parsed?.iv) return "";
    const key = await getOrCreateKey();
    if (!key) return "";
    const email = await decryptAesGcm({ ciphertext: parsed.ciphertext, iv: parsed.iv }, key);
    return typeof email === "string" ? email : "";
  } catch {
    window.localStorage.removeItem(EMAIL_STORAGE_KEY);
    return "";
  }
}

/**
 * Clears the remembered email from localStorage.
 *
 * @returns {void}
 */
export function clearRememberedEmail() {
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.removeItem(EMAIL_STORAGE_KEY);
}
