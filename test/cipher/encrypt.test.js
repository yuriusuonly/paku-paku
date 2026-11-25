import { describe, expect, test } from "bun:test";
import { encryptAesGcm } from "../../cipher/encrypt.js";

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
 * Tests for AES-GCM encryption.
 * @module test/cipher/encrypt
 */

describe("encryptAesGcm", () => {
  test("returns a base64url ciphertext and IV", async () => {
    const payload = await encryptAesGcm("secret message", await createKey());

    expect(payload.ciphertext).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(payload.iv).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(payload.ciphertext).not.toContain("secret");
  });

  test("uses a fresh IV for each encryption", async () => {
    const key = await createKey();
    const first = await encryptAesGcm("repeat", key);
    const second = await encryptAesGcm("repeat", key);

    expect(first.iv).not.toBe(second.iv);
    expect(first.ciphertext).not.toBe(second.ciphertext);
  });

  test("throws EncryptError when Web Crypto is unavailable", async () => {
    const original = globalThis.crypto;
    globalThis.crypto = {};

    try {
      await expect(encryptAesGcm("secret", original.subtle)).rejects.toMatchObject({
        name: "EncryptError",
        code: "encrypt_failed"
      });
    } finally {
      globalThis.crypto = original;
    }
  });
});
