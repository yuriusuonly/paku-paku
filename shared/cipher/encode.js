/**
 * Encoding utilities.
 * @module shared/cipher/encode
 */

/**
 * Encodes a UTF-8 string to base64url.
 *
 * @param {string} value - Plain text value.
 * @returns {string} Base64url-encoded string.
 */
export function encodeBase64Url(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const base64 = typeof btoa === "function" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/**
 * Encodes bytes to a hex string.
 *
 * @param {Uint8Array} bytes - Byte array.
 * @returns {string} Hex string.
 */
export function encodeHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
