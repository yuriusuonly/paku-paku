import { describe, expect, test } from "bun:test";
import { isPaid, isPending, isRefunded, isVoided } from "../../../src/domain/orders/status.js";

/**
 * Tests for pure order status rules.
 * @module test/domain/orders/rules
 */

describe("order status rules", () => {
  test("detects supported statuses", () => {
    expect(isPending("Pending")).toBe(true);
    expect(isPaid("Paid")).toBe(true);
    expect(isRefunded("Refunded")).toBe(true);
    expect(isVoided("Voided")).toBe(true);
    expect(isPaid("Pending")).toBe(false);
    expect(isPending("Paid")).toBe(false);
  });
});
