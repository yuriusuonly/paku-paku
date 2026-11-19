import { describe, expect, test } from "bun:test";
import { emailSchema, isValidEmail, requireEmail } from "../../../../src/shared/validation/email.js";

/**
 * Tests for email validation.
 * @module test/unit/shared/validation/email
 */

describe("email validation", () => {
  test("detects valid normalized emails", () => {
    expect(isValidEmail("User@Example.com")).toBe(true);
    expect(isValidEmail(" user@example.com ")).toBe(true);
    expect(isValidEmail("invalid")).toBe(false);
    expect(isValidEmail(null)).toBe(false);
    expect(emailSchema.safeParse("a@bc.co").success).toBe(true);
  });

  test("requireEmail returns normalized email", () => {
    expect(requireEmail("  User@Example.COM  ")).toBe("user@example.com");
  });

  test("requireEmail throws typed bad request errors", () => {
    try {
      requireEmail("bad", { code: "custom_code", message: "Custom message." });
      throw new Error("expected error");
    } catch (error) {
      expect(error.isAppError).toBe(true);
      expect(error.status).toBe(400);
      expect(error.code).toBe("custom_code");
      expect(error.message).toBe("Custom message.");
    }
  });
});
