import { describe, expect, test } from "bun:test";
import {
  getSupplySkus,
  hasPositiveStock,
  isBeverage,
  shouldAdjustInventory
} from "../../../src/domain/transactions/inventory-rules.js";
import { isCancelled, isCompleted, resolvePaymentStatus } from "../../../src/domain/transactions/status.js";

/**
 * Tests for pure transaction status and inventory rules.
 * @module test/domain/transactions/rules
 */

describe("transaction status rules", () => {
  test("detects cancelled and completed statuses", () => {
    expect(isCancelled("cancelled")).toBe(true);
    expect(isCancelled("completed")).toBe(false);
    expect(isCompleted("completed")).toBe(true);
    expect(isCompleted("pending")).toBe(false);
  });

  test("resolves payment status with fallback", () => {
    expect(resolvePaymentStatus("paid", "unpaid")).toBe("paid");
    expect(resolvePaymentStatus("", "unpaid")).toBe("unpaid");
    expect(resolvePaymentStatus(null, "paid")).toBe("paid");
  });
});

describe("transaction inventory rules", () => {
  test("classifies beverages by sort order and name", () => {
    expect(isBeverage("Tea", 200)).toBe(true);
    expect(isBeverage("Iced Matcha", 500)).toBe(true);
    expect(isBeverage("Ramen", 200)).toBe(false);
  });

  test("selects supply SKUs by item type", () => {
    expect(getSupplySkus({ name: "Iced Tea", sortOrder: 100 })).toEqual([
      "SUP-CUP-COLD",
      "SUP-LID",
      "SUP-NAPKIN"
    ]);
    expect(getSupplySkus({ name: "Ramen", sortOrder: 200 })).toEqual([
      "SUP-CONTAINER",
      "SUP-CHOPSTICKS",
      "SUP-NAPKIN"
    ]);
  });

  test("checks positive stock and cancellation", () => {
    expect(hasPositiveStock([{ quantity: 0 }, { quantity: 2 }])).toBe(true);
    expect(hasPositiveStock([{ quantity: 0 }])).toBe(false);
    expect(shouldAdjustInventory("cancelled")).toBe(false);
    expect(shouldAdjustInventory("completed")).toBe(true);
  });
});
