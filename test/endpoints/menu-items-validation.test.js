import { describe, expect, test } from "bun:test";
import { normalizeMenuItemInput } from "../../src/endpoints/menu-items/validation.js";

/**
 * Tests for menu item request validation.
 * @module test/endpoints/menu-items-validation
 */

describe("normalizeMenuItemInput", () => {
  test("normalizes create input with defaults", () => {
    expect(normalizeMenuItemInput({
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
    expect(normalizeMenuItemInput({
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
    expect(() => normalizeMenuItemInput({ sort_order: "" }, { partial: true })).toThrow();
  });

  test("rejects invalid values and empty partial updates", () => {
    expect(() => normalizeMenuItemInput({ name: "  " })).toThrow();
    expect(() => normalizeMenuItemInput({ name: "Ramen", price_cents: -1 })).toThrow();
    expect(() => normalizeMenuItemInput({ is_best_seller: "yes" }, { partial: true })).toThrow();
    expect(() => normalizeMenuItemInput({}, { partial: true })).toThrow();
  });
});
