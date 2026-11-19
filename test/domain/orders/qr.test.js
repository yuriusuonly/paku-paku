import { describe, expect, test } from "bun:test";
import { parseQrPayload } from "../../../src/domain/orders/qr.js";

/**
 * Tests for counter QR parsing.
 * @module test/domain/orders/qr
 */

describe("parseQrPayload", () => {
  test("parses a full QR payload", () => {
    expect(parseQrPayload("ORD:ORD-1|ID:t1|TOTAL:999|PAY:card|ITEMS:Iced Teax2,Ramenx1")).toEqual({
      orderNumber: "ORD-1",
      id: "t1",
      totalCents: 999,
      paymentMethod: "card",
      items: [
        { item_name: "Iced Tea", quantity: 2 },
        { item_name: "Ramen", quantity: 1 }
      ]
    });
  });

  test("treats plain input as an order reference", () => {
    expect(parseQrPayload("ORD-1")).toEqual({
      orderNumber: "ORD-1",
      id: null,
      totalCents: null,
      paymentMethod: null,
      items: []
    });
  });

  test("returns empty values for invalid input", () => {
    expect(parseQrPayload(null).orderNumber).toBeNull();
    expect(parseQrPayload("").orderNumber).toBeNull();
  });
});
