import { describe, expect, test } from "bun:test";
import { orderCreateSchema } from "../../../domain/orders/schema.js";

/**
 * Tests for the order create schema.
 * @module test/domain/orders/schema
 */

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
