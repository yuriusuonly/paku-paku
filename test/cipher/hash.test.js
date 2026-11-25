import { describe, expect, test } from "bun:test";
import {
  pbkdf2,
  verifyPbkdf2
} from "../../cipher/hash.js";
import { encodeBase64Url } from "../../cipher/encode.js";

/**
 * Fixed salt and cheap derivation options shared by the tests.
 *
 * @type {{salt: string, iterations: number, length: number}}
 */
const OPTIONS = {
  salt: encodeBase64Url("fixed-salt"),
  iterations: 1000,
  length: 16
};

/**
 * Tests for PBKDF2 hashing.
 * @module test/cipher/hash
 */

describe("pbkdf2", () => {
  test("derives a repeatable hash with the supplied parameters", async () => {
    const first = await pbkdf2("password", OPTIONS);
    const second = await pbkdf2("password", OPTIONS);

    expect(first.hash).toBe(second.hash);
    expect(first.hash).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(first.salt).toBe(OPTIONS.salt);
    expect(first.iterations).toBe(1000);
    expect(first.hashAlgorithm).toBe("SHA-256");
  });

  test("generates a random salt when none is supplied", async () => {
    const first = await pbkdf2("password", {
      iterations: 1000
    });
    const second = await pbkdf2("password", {
      iterations: 1000
    });

    expect(first.salt).not.toBe(second.salt);
    expect(first.hash).not.toBe(second.hash);
  });

  test("throws HashError when Web Crypto is unavailable", async () => {
    const original = globalThis.crypto;
    globalThis.crypto = {};

    try {
      await expect(pbkdf2("password", OPTIONS)).rejects.toMatchObject({
        name: "HashError",
        code: "hash_failed"
      });
    } finally {
      globalThis.crypto = original;
    }
  });
});

describe("verifyPbkdf2", () => {
  test("accepts the matching password and rejects a different one", async () => {
    const stored = await pbkdf2("correct", OPTIONS);

    await expect(verifyPbkdf2("correct", stored)).resolves.toBe(true);
    await expect(verifyPbkdf2("wrong", stored)).resolves.toBe(false);
  });
});
