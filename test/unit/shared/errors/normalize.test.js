import { describe, expect, test } from "bun:test";
import { normalizeError } from "../../../../shared/errors/normalize.js";

/**
 * Tests for error normalization.
 * @module test/unit/shared/errors/normalize
 */

describe("normalizeError", () => {
  test("returns app errors unchanged", () => {
    const appError = Object.assign(new Error("Denied"), {
      isAppError: true,
      status: 403,
      code: "forbidden",
      expose: true
    });
    expect(normalizeError(appError)).toBe(appError);
  });

  test("wraps unknown errors as internal app errors", () => {
    const cause = new Error("boom");
    const normalized = normalizeError(cause);
    expect(normalized).toBeInstanceOf(Error);
    expect(normalized.isAppError).toBe(true);
    expect(normalized.status).toBe(500);
    expect(normalized.code).toBe("internal_error");
    expect(normalized.expose).toBe(false);
    expect(normalized.cause).toBe(cause);
  });

  test("wraps non-error thrown values", () => {
    const normalized = normalizeError("nope");
    expect(normalized.isAppError).toBe(true);
    expect(normalized.status).toBe(500);
    expect(normalized.code).toBe("internal_error");
  });
});
