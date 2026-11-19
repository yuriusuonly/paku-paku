import { describe, expect, test } from "bun:test";
import { buildComboCartItem, getComboKey, getComboName, getComboPriceCents } from "../../../src/domain/menu/combo.js";

/**
 * Tests for build-your-own combo rules.
 * @module test/domain/menu/combo
 */

const food = { id: "f1", name: "Karaage", price_cents: 8500 };
const drink = { id: "d2", name: "Green tea", price_cents: 5500 };

describe("menu combo rules", () => {
  test("builds a unique key and snapshot name", () => {
    expect(getComboKey(food, drink)).toBe("combo:f1:d2");
    expect(getComboName(food, drink)).toBe("Karaage + Green tea");
  });

  test("adds food and drink prices", () => {
    expect(getComboPriceCents(food, drink)).toBe(14000);
  });

  test("builds a cart item with quantity one", () => {
    expect(buildComboCartItem(food, drink)).toEqual({
      item_id: "combo:f1:d2",
      item_name: "Karaage + Green tea",
      unit_price_cents: 14000,
      quantity: 1
    });
  });

  test("returns null for incomplete selections", () => {
    expect(buildComboCartItem(food, null)).toBeNull();
    expect(buildComboCartItem(null, drink)).toBeNull();
  });
});
