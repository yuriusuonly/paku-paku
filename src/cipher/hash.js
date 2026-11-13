import { encodeHex } from "./encode.js";

/**
 * Hashing utilities.
 * @module cipher/hash
 */

/**
 * Computes a SHA-256 hash of a UTF-8 string.
 *
 * @param {string} value - Input value.
 * @returns {Promise<string>} Hex-encoded hash.
 */
export async function sha256(value) {
  const data = new TextEncoder().encode(value);
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("Web Crypto API is not available for hashing.");
  }
  const digest = await subtle.digest("SHA-256", data);
  return encodeHex(new Uint8Array(digest));
}
