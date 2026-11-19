import { describe, expect, test } from "bun:test";
import { formatCurrencyCents } from "../../../../src/shared/format/currency.js";

/**
 * Tests for currency formatting helpers.
 * @module test/unit/shared/format/currency
 */

describe("formatCurrencyCents", () => {
  test("formats cents using default currency symbol", () => {
    expect(formatCurrencyCents(12345)).toBe("₱123.45");
    expect(formatCurrencyCents(0)).toBe("₱0.00");
  });

  test("handles nullish and numeric-like values", () => {
    expect(formatCurrencyCents(null)).toBe("₱0.00");
    expect(formatCurrencyCents(undefined)).toBe("₱0.00");
    expect(formatCurrencyCents("250")).toBe("₱2.50");
  });

  test("supports custom symbol override", () => {
    expect(formatCurrencyCents(9900, { symbol: "$" })).toBe("$99.00");
  });

  test("formats negative and fractional inputs deterministically", () => {
    expect(formatCurrencyCents(-150)).toBe("₱-1.50");
    expect(formatCurrencyCents(99.9)).toBe("₱1.00");
  });
});
