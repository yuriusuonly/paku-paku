import { describe, expect, test } from "bun:test";
import { z } from "zod";
import {
  hasOwn,
  parseWithSchema,
  readBoolean,
  readInteger,
  readNullableString,
  readRouteId,
  requireObjectBody,
  requireString,
  requireUpdateFields
} from "../../../src/validation/request.js";

/**
 * Tests for request validation helpers.
 * @module test/validation/request
 */

describe("parseWithSchema", () => {
  test("uses a typed default error when no options are supplied", () => {
    try {
      parseWithSchema(z.string(), 1);
      throw new Error("expected error");
    } catch (error) {
      expect(error.isAppError).toBe(true);
      expect(error.code).toBe("invalid_request");
      expect(error.message.length).toBeGreaterThan(0);
    }
  });
});

describe("requireObjectBody", () => {
  test("returns valid object bodies", () => {
    expect(requireObjectBody({ a: 1 })).toEqual({ a: 1 });
  });

  test("throws badRequest for invalid bodies", () => {
    for (const body of [null, undefined, [], "x", 1]) {
      try {
        requireObjectBody(body, "Custom body message.");
        throw new Error("expected error");
      } catch (error) {
        expect(error.isAppError).toBe(true);
        expect(error.status).toBe(400);
        expect(error.code).toBe("invalid_body");
        expect(error.message).toBe("Custom body message.");
      }
    }
  });
});

describe("field validators", () => {
  test("hasOwn checks own fields", () => {
    expect(hasOwn({ id: 1 }, "id")).toBe(true);
    expect(hasOwn({}, "id")).toBe(false);
  });

  test("requireString trims and requires non-empty values", () => {
    expect(requireString("  abc  ")).toBe("abc");
    expect(() => requireString("   ")).toThrow();
  });

  test("readNullableString maps empty values to null", () => {
    expect(readNullableString(null)).toBeNull();
    expect(readNullableString("   ")).toBeNull();
    expect(readNullableString(" abc ")).toBe("abc");
    expect(() => readNullableString(123)).toThrow();
  });

  test("readInteger enforces integers, bounds, and defaults", () => {
    expect(readInteger("12")).toBe(12);
    expect(readInteger(null, { defaultValue: 0 })).toBe(0);
    expect(() => readInteger("-1", { min: 0, message: "too small" })).toThrow("too small");
    expect(() => readInteger("1.5")).toThrow();
  });

  test("readBoolean requires booleans", () => {
    expect(readBoolean(true)).toBe(true);
    expect(() => readBoolean("true")).toThrow();
  });

  test("readRouteId reads params then path and trims", () => {
    expect(readRouteId({ params: { id: "  p1 " }, url: new URL("http://x/api/items/path1") })).toBe("p1");
    expect(readRouteId({ params: {}, url: new URL("http://x/api/items/path1") })).toBe("path1");
    expect(() => readRouteId({ params: {}, url: new URL("http://x/") })).toThrow();
  });

  test("requireUpdateFields rejects empty updates", () => {
    expect(() => requireUpdateFields({})).toThrow();
    expect(requireUpdateFields({ a: 1 })).toBeUndefined();
  });
});
