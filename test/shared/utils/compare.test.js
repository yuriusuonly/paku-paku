import { describe, expect, test } from "bun:test";
import { isSameRecord } from "../../../src/shared/utils/compare.js";

/**
 * Tests for comparison helpers.
 * @module test/shared/utils/compare
 */

describe("isSameRecord", () => {
  test("returns true for identical references and shallow-equal records", () => {
    const a = { id: 1, name: "x", active: true };
    const b = { id: 1, name: "x", active: true };
    expect(isSameRecord(a, a)).toBe(true);
    expect(isSameRecord(a, b)).toBe(true);
  });

  test("returns false for nullish, key-count, or value differences", () => {
    expect(isSameRecord(null, {})).toBe(false);
    expect(isSameRecord({}, null)).toBe(false);
    expect(isSameRecord({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(isSameRecord({ a: 1 }, { a: 2 })).toBe(false);
  });

  test("uses Object.is semantics for values", () => {
    expect(isSameRecord({ a: NaN }, { a: NaN })).toBe(true);
    expect(isSameRecord({ a: 0 }, { a: -0 })).toBe(false);
  });

  test("compares own enumerable keys shallowly", () => {
    const nested = { x: 1 };
    expect(isSameRecord({ nested }, { nested })).toBe(true);
    expect(isSameRecord({ nested }, { nested: { x: 1 } })).toBe(false);
  });
});
