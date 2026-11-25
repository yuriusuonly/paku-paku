import { encryptError } from "../errors/encrypt-error.js";
import { encodeBase64Url } from "./encode.js";

/**
 * Encryption utilities.
 * @module shared/cipher/encrypt
 */

/**
 * Encrypts a UTF-8 string with AES-GCM.
 *
 * @param {string} plaintext - Plain text to encrypt.
 * @param {CryptoKey} key - AES-GCM CryptoKey.
 * @returns {Promise<{ciphertext: string, iv: string}>} Base64url-encoded ciphertext and IV.
 */
export async function encryptAesGcm(plaintext, key) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw encryptError("Web Crypto API is not available for encryption.");
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(plaintext);
  const encrypted = await subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  return {
    ciphertext: encodeBase64Url(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: encodeBase64Url(String.fromCharCode(...iv))
  };
}
