import { describe, expect, test } from "bun:test";
import { normalizeOrderItems } from "../../../src/domain/orders/items.js";

/**
 * Tests for order item normalization.
 * @module test/domain/orders/items
 */

describe("normalizeOrderItems", () => {
  test("normalizes valid items and calculates line totals", () => {
    expect(normalizeOrderItems([
      {
        item_name: "  Ramen  ",
        quantity: "2",
        unit_price_cents: "500",
        menu_item_id: "m1"
      }
    ])).toEqual([{
      menu_item_id: "m1",
      item_name: "Ramen",
      quantity: 2,
      unit_price_cents: 500,
      line_total_cents: 1000
    }]);
  });

  test("rejects empty, unnamed, invalid quantity, and invalid price items", () => {
    expect(() => normalizeOrderItems([])).toThrow();
    expect(() => normalizeOrderItems([{ item_name: "", quantity: 1, unit_price_cents: 0 }])).toThrow();
    expect(() => normalizeOrderItems([{ item_name: "A", quantity: 0, unit_price_cents: 0 }])).toThrow();
    expect(() => normalizeOrderItems([{ item_name: "A", quantity: 1, unit_price_cents: -1 }])).toThrow();
  });
});
