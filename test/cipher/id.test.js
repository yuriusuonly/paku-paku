import { describe, expect, test } from "bun:test";
import { generateId } from "../../cipher/id.js";

/**
 * UUID v4 pattern used by both generation paths.
 *
 * @type {RegExp}
 */
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/**
 * Tests for identifier generation.
 * @module test/cipher/id
 */

describe("generateId", () => {
  test("produces unique UUID v4 strings", () => {
    const values = new Set(Array.from({ length: 20 }, () => generateId()));

    expect(values.size).toBe(20);
    for (const value of values) expect(value).toMatch(UUID_V4);
  });

  test("falls back to Math.random when Web Crypto is unavailable", () => {
    const original = globalThis.crypto;
    globalThis.crypto = {};

    try {
      expect(generateId()).toMatch(UUID_V4);
    } finally {
      globalThis.crypto = original;
    }
  });

  test("falls back to random bytes when randomUUID is unavailable", () => {
    const original = globalThis.crypto;
    globalThis.crypto = {
      getRandomValues: (bytes) => bytes.fill(7)
    };

    try {
      expect(generateId()).toMatch(UUID_V4);
    } finally {
      globalThis.crypto = original;
    }
  });
});
