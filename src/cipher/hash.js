import { encodeBase64Url } from "./encode.js";
import { decodeBase64Url } from "./decode.js";

/**
 * Hashing utilities using PBKDF2 via the Web Crypto API.
 * @module cipher/hash
 */

/**
 * Derives a key/hash from a password using PBKDF2 (SHA-256).
 *
 * @param {string} password - Password or secret input.
 * @param {object} [options] - Derivation options.
 * @param {string} [options.salt] - Base64url-encoded salt. When omitted, a random salt is generated.
 * @param {number} [options.iterations=100000] - PBKDF2 iteration count.
 * @param {number} [options.length=32] - Derived key length in bytes.
 * @param {"SHA-256" | "SHA-384" | "SHA-512"} [options.hash="SHA-256"] - Underlying hash algorithm.
 * @returns {Promise<{hash: string, salt: string, iterations: number, hashAlgorithm: string}>} Derived hash and parameters.
 */
export async function pbkdf2(password, options = {}) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("Web Crypto API is not available for hashing.");
  }

  const iterations = options.iterations ?? 100000;
  const length = options.length ?? 32;
  const hashAlgorithm = options.hash ?? "SHA-256";

  const saltBytes = options.salt
    ? Uint8Array.from(decodeBase64Url(options.salt), (c) => c.charCodeAt(0))
    : globalThis.crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations,
      hash: hashAlgorithm
    },
    keyMaterial,
    length * 8
  );

  const derived = new Uint8Array(bits);
  const toBase64Url = (bytes) => {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    const base64 = typeof btoa === "function" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  };

  return {
    hash: toBase64Url(derived),
    salt: options.salt ?? toBase64Url(saltBytes),
    iterations,
    hashAlgorithm
  };
}

/**
 * Verifies a password against a PBKDF2 hash.
 *
 * @param {string} password - Password to verify.
 * @param {{hash: string, salt: string, iterations?: number, length?: number, hashAlgorithm?: "SHA-256" | "SHA-384" | "SHA-512"}} expected - Stored hash parameters.
 * @returns {Promise<boolean>} Whether the password matches.
 */
export async function verifyPbkdf2(password, expected) {
  const result = await pbkdf2(password, {
    salt: expected.salt,
    iterations: expected.iterations ?? 100000,
    length: expected.length ?? 32,
    hash: expected.hashAlgorithm ?? "SHA-256"
  });
  return result.hash === expected.hash;
}
