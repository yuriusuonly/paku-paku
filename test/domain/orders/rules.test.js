import { describe, expect, test } from "bun:test";
import { isCancelled, isCompleted, resolvePaymentStatus } from "../../../src/domain/orders/status.js";

/**
 * Tests for pure order status rules.
 * @module test/domain/orders/rules
 */

describe("order status rules", () => {
  test("detects cancelled and completed statuses", () => {
    expect(isCancelled("cancelled")).toBe(true);
    expect(isCancelled("completed")).toBe(false);
    expect(isCompleted("completed")).toBe(true);
    expect(isCompleted("pending")).toBe(false);
  });

  test("resolves payment status with fallback", () => {
    expect(resolvePaymentStatus("paid", "unpaid")).toBe("paid");
    expect(resolvePaymentStatus("", "unpaid")).toBe("unpaid");
    expect(resolvePaymentStatus(null, "paid")).toBe("paid");
  });
});
