import { describe, expect, test } from "bun:test";
import { buildQrPayload, calculateOrderSubtotal } from "../../../domain/orders/totals.js";

/**
 * Tests for order total rules.
 * @module test/domain/orders/totals
 */

describe("order totals", () => {
  test("calculates subtotal from line totals", () => {
    expect(calculateOrderSubtotal([{ line_total_cents: 500 }, { line_total_cents: 250 }])).toBe(750);
    expect(calculateOrderSubtotal(null)).toBe(0);
  });

  test("builds deterministic QR payload", () => {
    expect(buildQrPayload({ orderNumber: "ORD-1", id: "t1", totalCents: 999 })).toBe("ORD:ORD-1|ID:t1|TOTAL:999");
  });

  test("includes payment method and items in QR payload", () => {
    expect(buildQrPayload({
      orderNumber: "ORD-1",
      id: "t1",
      totalCents: 999,
      paymentMethod: "card",
      items: [{ item_name: "Iced Tea", quantity: 2 }]
    })).toBe("ORD:ORD-1|ID:t1|TOTAL:999|PAY:card|ITEMS:Iced Teax2");
  });
});
