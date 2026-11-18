import { describe, expect, test } from "bun:test";
import { normalizeItemInput } from "../../src/endpoints/items/validation.js";

/**
 * Tests for item request validation.
 * @module test/endpoints/items-validation
 */

describe("normalizeItemInput", () => {
  test("normalizes create input with defaults", () => {
    expect(normalizeItemInput({
      name: "  Ramen  ",
      description: "",
      price_cents: "1200",
      is_available: true
    })).toEqual({
      name: "Ramen",
      description: null,
      price_cents: 1200,
      is_available: true,
      is_best_seller: false
    });
  });

  test("keeps explicit sort order and best seller flag on create", () => {
    expect(normalizeItemInput({
      name: "Tea",
      price_cents: 500,
      is_available: true,
      is_best_seller: true,
      sort_order: "0"
    })).toEqual({
      name: "Tea",
      description: null,
      price_cents: 500,
      is_available: true,
      is_best_seller: true,
      sort_order: 0
    });
  });

  test("ignores empty sort order on partial updates and rejects empty updates", () => {
    expect(() => normalizeItemInput({ sort_order: "" }, { partial: true })).toThrow();
  });

  test("rejects invalid values and empty partial updates", () => {
    expect(() => normalizeItemInput({ name: "  " })).toThrow();
    expect(() => normalizeItemInput({ name: "Ramen", price_cents: -1 })).toThrow();
    expect(() => normalizeItemInput({ is_best_seller: "yes" }, { partial: true })).toThrow();
    expect(() => normalizeItemInput({}, { partial: true })).toThrow();
  });
});
