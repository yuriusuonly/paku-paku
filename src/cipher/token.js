import { encodeBase64Url } from "./encode.js";

/**
 * Token generation utilities.
 * @module cipher/token
 */

/**
 * Generates a cryptographically random token.
 *
 * @param {number} [bytesLength=32] - Number of random bytes.
 * @returns {string} Base64url token string.
 */
export function generateToken(bytesLength = 32) {
  const bytes = new Uint8Array(bytesLength);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const base64 = typeof btoa === "function" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
