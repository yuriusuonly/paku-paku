import { describe, expect, test } from "bun:test";
import { isSameRecord, upsertById } from "../../../../helpers/records.js";

/**
 * Tests for record helpers.
 * @module test/unit/shared/utils/records
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
});

describe("upsertById", () => {
  test("appends records with new ids", () => {
    const items = [{ id: 1, name: "a" }];
    expect(upsertById(items, { id: 2, name: "b" })).toEqual([
      { id: 1, name: "a" },
      { id: 2, name: "b" }
    ]);
    expect(items).toEqual([{ id: 1, name: "a" }]);
  });

  test("merges existing records and returns original list when unchanged", () => {
    const items = [{ id: 1, name: "a", price: 1 }];
    expect(upsertById(items, { id: 1, price: 1 })).toBe(items);
    expect(upsertById(items, { id: 1, name: "b" })).toEqual([{ id: 1, name: "b", price: 1 }]);
  });

  test("applies optional sorting to updated lists", () => {
    const items = [{ id: 1, name: "b" }];
    const sort = (records) => [...records].sort((a, b) => a.name.localeCompare(b.name));
    expect(upsertById(items, { id: 2, name: "a" }, { sort })).toEqual([
      { id: 2, name: "a" },
      { id: 1, name: "b" }
    ]);
  });
});
