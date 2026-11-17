import { describe, expect, test } from "bun:test";
import { menuItemCreateSchema } from "../../src/domain/menu-items/schema.js";
import { createUserSchema } from "../../src/domain/profiles/schema.js";
import { transactionCreateSchema } from "../../src/domain/transactions/schema.js";

/**
 * Tests for shared domain schemas.
 * @module test/domain/schemas
 */

describe("menuItemCreateSchema", () => {
  test("applies create defaults", () => {
    const result = menuItemCreateSchema.safeParse({
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
    expect(menuItemCreateSchema.safeParse({ name: "", price_cents: 1, is_available: true }).success).toBe(false);
    expect(menuItemCreateSchema.safeParse({ name: "A", price_cents: -1, is_available: true }).success).toBe(false);
  });
});

describe("createUserSchema", () => {
  test("normalizes email and enforces password length", () => {
    const result = createUserSchema.safeParse({
      email: "  User@Example.COM ",
      password: "secret1"
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("user@example.com");
    expect(createUserSchema.safeParse({ email: "a@bc.co", password: "short" }).success).toBe(false);
  });
});

describe("transactionCreateSchema", () => {
  test("normalizes items and calculates line totals", () => {
    const result = transactionCreateSchema.safeParse({
      items: [{ item_name: "Ramen", quantity: "2", unit_price_cents: "500" }]
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kind).toBe("sell");
      expect(result.data.status).toBe("completed");
      expect(result.data.payment_status).toBe("paid");
      expect(result.data.items[0].line_total_cents).toBe(1000);
    }
  });

  test("rejects empty item lists and invalid statuses", () => {
    expect(transactionCreateSchema.safeParse({ items: [] }).success).toBe(false);
    expect(transactionCreateSchema.safeParse({
      status: "unknown",
      items: [{ item_name: "A", quantity: 1, unit_price_cents: 0 }]
    }).success).toBe(false);
  });
});
