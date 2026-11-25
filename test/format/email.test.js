import { describe, expect, test } from "bun:test";
import { normalizeEmail } from "../../format/email.js";

/**
 * Tests for email formatting.
 * @module test/format/email
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
