import { describe, expect, test } from "bun:test";
import { normalizeEmail } from "../../../src/shared/utils/string.js";

/**
 * Tests for string helpers.
 * @module test/shared/utils/string
 */

describe("normalizeEmail", () => {
  test("trims and lowercases string values", () => {
    expect(normalizeEmail("  User@Example.COM  ")).toBe("user@example.com");
    expect(normalizeEmail("admin@local.test")).toBe("admin@local.test");
  });

  test("returns empty string for non-string values", () => {
    expect(normalizeEmail(null)).toBe("");
    expect(normalizeEmail(undefined)).toBe("");
    expect(normalizeEmail(123)).toBe("");
    expect(normalizeEmail({ email: "a@b.c" })).toBe("");
  });

  test("handles empty and whitespace-only strings", () => {
    expect(normalizeEmail("")).toBe("");
    expect(normalizeEmail("   ")).toBe("");
  });
});
