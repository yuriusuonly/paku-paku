/**
 * Decoding utilities.
 * @module shared/cipher/decode
 */

/**
 * Decodes a base64url string to UTF-8 text.
 *
 * @param {string} value - Base64url-encoded string.
 * @returns {string} Decoded UTF-8 string.
 */
export function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = typeof atob === "function" ? atob(base64) : Buffer.from(base64, "base64").toString("binary");
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Decodes a hex string to bytes.
 *
 * @param {string} value - Hex string.
 * @returns {Uint8Array} Byte array.
 */
export function decodeHex(value) {
  const clean = value.length % 2 === 0 ? value : `0${value}`;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return bytes;
}
