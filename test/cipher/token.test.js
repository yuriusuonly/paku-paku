import { describe, expect, test } from "bun:test";
import { generateToken } from "../../cipher/token.js";

/**
 * Tests for random token generation.
 * @module test/cipher/token
 */

describe("generateToken", () => {
  test("returns a URL-safe base64url token", () => {
    const token = generateToken();

    expect(token).toHaveLength(43);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  test("honours a custom byte length", () => {
    expect(generateToken(16)).toHaveLength(22);
    expect(generateToken(0)).toBe("");
  });

  test("produces distinct tokens and falls back without Web Crypto", () => {
    const original = globalThis.crypto;

    try {
      globalThis.crypto = {};
      const first = generateToken(24);
      const second = generateToken(24);

      expect(first).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(first).not.toBe(second);
    } finally {
      globalThis.crypto = original;
    }
  });
});
