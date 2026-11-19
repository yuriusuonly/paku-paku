import { describe, expect, test } from "bun:test";
import { isValidPassword, requirePassword } from "../../../../src/shared/validation/password.js";

/**
 * Tests for password validation.
 * @module test/unit/shared/validation/password
 */

describe("password validation", () => {
  test("accepts strings meeting minimum length", () => {
    expect(isValidPassword("123456")).toBe(true);
    expect(isValidPassword("secret1")).toBe(true);
    expect(isValidPassword("12345")).toBe(false);
    expect(isValidPassword(null)).toBe(false);
  });

  test("requirePassword returns password and throws typed errors", () => {
    expect(requirePassword("secret1")).toBe("secret1");
    try {
      requirePassword("short");
      throw new Error("expected error");
    } catch (error) {
      expect(error.isAppError).toBe(true);
      expect(error.status).toBe(400);
      expect(error.code).toBe("invalid_password");
    }
  });
});
