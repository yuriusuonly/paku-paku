import { describe, expect, test } from "bun:test";
import { calculateOrderTotals, getMealDiscountCents, hasMealPair, MEAL_DISCOUNT_CENTS } from "../../../src/domain/orders/pricing.js";

/**
 * Tests for order pricing rules.
 * @module test/domain/orders/pricing
 */

const food = { category: "food", quantity: 1, unit_price_cents: 8000 };
const drink = { category: "beverage", quantity: 1, unit_price_cents: 2500 };

describe("order pricing", () => {
  test("applies a ₱20 discount to a dish and drink pair", () => {
    expect(MEAL_DISCOUNT_CENTS).toBe(2000);
    expect(hasMealPair([food, drink])).toBe(true);
    expect(getMealDiscountCents([food, drink])).toBe(2000);
    expect(calculateOrderTotals([food, drink])).toEqual({
      subtotalCents: 10500,
      discountCents: 2000,
      totalCents: 8500
    });
  });

  test("does not discount single-category orders", () => {
    expect(hasMealPair([food])).toBe(false);
    expect(getMealDiscountCents([food])).toBe(0);
    expect(calculateOrderTotals([food, { ...food, item_name: "Second dish" }]).discountCents).toBe(0);
  });

  test("caps the discount at the subtotal", () => {
    expect(calculateOrderTotals([
      { category: "food", quantity: 1, unit_price_cents: 500 },
      { category: "beverage", quantity: 1, unit_price_cents: 500 }
    ]).totalCents).toBe(0);
  });
});
