import { describe, expect, test } from "bun:test";
import { decryptAesGcm } from "../../../src/cipher/decrypt.js";
import { encryptAesGcm } from "../../../src/cipher/encrypt.js";

/**
 * Generates a fresh AES-GCM key for a test.
 *
 * @returns {Promise<CryptoKey>} Encryption key.
 */
const createKey = () => globalThis.crypto.subtle.generateKey({
  name: "AES-GCM",
  length: 256
}, true, [
  "encrypt",
  "decrypt"
]);

/**
 * Tests for AES-GCM decryption.
 * @module test/cipher/decrypt
 */

describe("decryptAesGcm", () => {
  test("restores the original UTF-8 plaintext", async () => {
    const key = await createKey();
    const value = "café ☕ order #42";
    const payload = await encryptAesGcm(value, key);

    await expect(decryptAesGcm(payload, key)).resolves.toBe(value);
  });

  test("rejects a tampered ciphertext", async () => {
    const key = await createKey();
    const payload = await encryptAesGcm("secret", key);
    const swapped = payload.ciphertext[0] === "A" ? "B" : "A";
    const tampered = {
      ...payload,
      ciphertext: swapped + payload.ciphertext.slice(1)
    };

    await expect(decryptAesGcm(tampered, key)).rejects.toBeDefined();
  });

  test("throws DecryptError when Web Crypto is unavailable", async () => {
    const original = globalThis.crypto;
    globalThis.crypto = {};

    try {
      await expect(decryptAesGcm({
        ciphertext: "aGVsbG8",
        iv: "aGVsbG8"
      }, original.subtle)).rejects.toMatchObject({
        name: "DecryptError",
        code: "decrypt_failed"
      });
    } finally {
      globalThis.crypto = original;
    }
  });
});
