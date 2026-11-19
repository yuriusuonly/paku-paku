import { describe, expect, test } from "bun:test";
import {
  buildComboCartItem,
  COMBO_DISCOUNT_CENTS,
  getComboKey,
  getComboName,
  getComboOriginalPriceCents,
  getComboPriceCents,
  getComboSavingsCents
} from "../../../src/domain/menu/combo.js";

/**
 * Tests for combo meal rules.
 * @module test/domain/menu/combo
 */

const food = { id: "f1", name: "Teriyaki", price_cents: 8000 };
const drink = { id: "d2", name: "Green tea", price_cents: 2500 };

describe("menu combo rules", () => {
  test("uses a ₱20 discount", () => {
    expect(COMBO_DISCOUNT_CENTS).toBe(2000);
    expect(getComboOriginalPriceCents(food, drink)).toBe(10500);
    expect(getComboSavingsCents(food, drink)).toBe(2000);
    expect(getComboPriceCents(food, drink)).toBe(8500);
  });

  test("never prices a combo below zero", () => {
    const cheapFood = { id: "f2", name: "Mini tamago", price_cents: 600 };
    const cheapDrink = { id: "d3", name: "Tea", price_cents: 500 };
    expect(getComboPriceCents(cheapFood, cheapDrink)).toBe(0);
  });

  test("builds a unique key and snapshot name", () => {
    expect(getComboKey(food, drink)).toBe("combo:f1:d2");
    expect(getComboName(food, drink)).toBe("Teriyaki + Green tea");
  });

  test("builds a discounted cart item with quantity one", () => {
    expect(buildComboCartItem(food, drink)).toEqual({
      item_id: "combo:f1:d2",
      item_name: "Teriyaki + Green tea",
      unit_price_cents: 8500,
      quantity: 1
    });
  });

  test("returns null for incomplete selections", () => {
    expect(buildComboCartItem(food, null)).toBeNull();
    expect(buildComboCartItem(null, drink)).toBeNull();
  });
});
