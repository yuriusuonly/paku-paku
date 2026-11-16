import { describe, expect, test } from "bun:test";
import { calculateAdjustedQuantity } from "../../../src/domain/inventory/quantity.js";
import {
  getInventoryStatusLabel,
  INVENTORY_STATUS,
  isInStock
} from "../../../src/domain/inventory/status.js";

/**
 * Tests for pure inventory rules.
 * @module test/domain/inventory/rules
 */

describe("inventory rules", () => {
  test("clamps adjusted quantity at zero", () => {
    expect(calculateAdjustedQuantity(10, -3)).toBe(7);
    expect(calculateAdjustedQuantity(2, -5)).toBe(0);
    expect(calculateAdjustedQuantity(null, 4)).toBe(4);
  });

  test("exposes inventory status labels", () => {
    expect(getInventoryStatusLabel(true)).toBe(INVENTORY_STATUS.active);
    expect(getInventoryStatusLabel(false)).toBe(INVENTORY_STATUS.inactive);
    expect(isInStock({ is_active: true })).toBe(true);
    expect(isInStock({ is_active: false })).toBe(false);
  });
});
