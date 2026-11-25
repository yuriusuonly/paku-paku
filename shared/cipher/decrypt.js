import { decryptError } from "../errors/decrypt-error.js";
import { decodeBase64Url } from "./decode.js";

/**
 * Decryption utilities.
 * @module shared/cipher/decrypt
 */

/**
 * Decrypts an AES-GCM payload produced by `encryptAesGcm`.
 *
 * @param {{ciphertext: string, iv: string}} payload - Encrypted payload.
 * @param {CryptoKey} key - AES-GCM CryptoKey.
 * @returns {Promise<string>} Decrypted UTF-8 string.
 */
export async function decryptAesGcm(payload, key) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw decryptError("Web Crypto API is not available for decryption.");
  const ivBytes = Uint8Array.from(decodeBase64Url(payload.iv), (c) => c.charCodeAt(0));
  const cipherBytes = Uint8Array.from(decodeBase64Url(payload.ciphertext), (c) => c.charCodeAt(0));
  const decrypted = await subtle.decrypt({ name: "AES-GCM", iv: ivBytes }, key, cipherBytes);
  return new TextDecoder().decode(decrypted);
}
