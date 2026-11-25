import { describe, expect, test } from "bun:test";
import { getErrorMessage } from "../../errors/message.js";

/**
 * Tests for user-facing error messages.
 * @module test/errors/message
 */

describe("getErrorMessage", () => {
  test("returns error.message when present", () => {
    expect(getErrorMessage(new Error("Invalid input"), "Fallback")).toBe("Invalid input");
    expect(getErrorMessage({ message: "  Custom  " }, "Fallback")).toBe("  Custom  ");
  });

  test("returns fallback for empty or invalid messages", () => {
    expect(getErrorMessage(null, "Fallback")).toBe("Fallback");
    expect(getErrorMessage({}, "Fallback")).toBe("Fallback");
    expect(getErrorMessage({ message: "   " }, "Fallback")).toBe("Fallback");
    expect(getErrorMessage("error", "Fallback")).toBe("Fallback");
  });
});
