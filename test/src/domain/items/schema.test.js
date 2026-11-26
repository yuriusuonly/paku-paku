import { describe, expect, test } from "bun:test";
import { itemCreateSchema } from "../../../../src/domain/items/schema.js";

/**
 * Tests for the item create schema.
 * @module test/domain/items/schema
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
