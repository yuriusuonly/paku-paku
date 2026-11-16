import { describe, expect, test } from "bun:test";
import { normalizeInventoryInput } from "../../src/endpoints/admin/inventory/validation.js";

/**
 * Tests for inventory item request validation.
 * @module test/endpoints/inventory-validation
 */

describe("normalizeInventoryInput", () => {
  test("normalizes create input with defaults", () => {
    expect(normalizeInventoryInput({
      name: "  Rice  ",
      is_active: true
    })).toEqual({
      name: "Rice",
      sku: null,
      description: null,
      quantity: 0,
      unit: null,
      reorder_level: 0,
      unit_cost_cents: 0,
      menu_item_id: null,
      is_active: true
    });
  });

  test("requires is_active on create", () => {
    expect(() => normalizeInventoryInput({ name: "Rice" })).toThrow();
  });

  test("accepts numeric fields as strings on partial updates", () => {
    expect(normalizeInventoryInput({ quantity: "5", unit_cost_cents: "250" }, { partial: true })).toEqual({
      quantity: 5,
      unit_cost_cents: 250
    });
  });

  test("rejects invalid values and empty partial updates", () => {
    expect(() => normalizeInventoryInput({ quantity: -1, is_active: true })).toThrow();
    expect(() => normalizeInventoryInput({ sku: 123 }, { partial: true })).toThrow();
    expect(() => normalizeInventoryInput({}, { partial: true })).toThrow();
  });
});
