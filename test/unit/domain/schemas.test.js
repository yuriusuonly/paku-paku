import { describe, expect, test } from "bun:test";
import { itemCreateSchema } from "../../../src/domain/items/schema.js";
import { orderCreateSchema } from "../../../src/domain/orders/schema.js";

/**
 * Tests for shared domain schemas.
 * @module test/unit/domain/schemas
 */

describe("itemCreateSchema", () => {
  test("applies create defaults", () => {
    const result = itemCreateSchema.safeParse({
      name: " Ramen ",
      price_cents: "500",
      is_available: true
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        name: "Ramen",
        description: null,
        price_cents: 500,
        is_available: true,
        is_best_seller: false
      });
    }
  });

  test("rejects invalid names and prices", () => {
    expect(itemCreateSchema.safeParse({ name: "", price_cents: 1, is_available: true }).success).toBe(false);
    expect(itemCreateSchema.safeParse({ name: "A", price_cents: -1, is_available: true }).success).toBe(false);
  });
});

describe("orderCreateSchema", () => {
  test("normalizes items and calculates line totals", () => {
    const result = orderCreateSchema.safeParse({
      items: [{ item_name: "Ramen", quantity: "2", unit_price_cents: "500" }]
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("Paid");
      expect(result.data.items[0].line_total_cents).toBe(1000);
    }
  });

  test("rejects empty item lists and invalid statuses", () => {
    expect(orderCreateSchema.safeParse({ items: [] }).success).toBe(false);
    expect(orderCreateSchema.safeParse({
      status: "unknown",
      items: [{ item_name: "A", quantity: 1, unit_price_cents: 0 }]
    }).success).toBe(false);
  });
});
