import { describe, expect, test } from "bun:test";
import { buildQrPayload, calculateTransactionSubtotal } from "../../../src/domain/transactions/totals.js";

/**
 * Tests for transaction total rules.
 * @module test/domain/transactions/totals
 */

describe("transaction totals", () => {
  test("calculates subtotal from line totals", () => {
    expect(calculateTransactionSubtotal([{ line_total_cents: 500 }, { line_total_cents: 250 }])).toBe(750);
    expect(calculateTransactionSubtotal(null)).toBe(0);
  });

  test("builds deterministic QR payload", () => {
    expect(buildQrPayload({ orderNumber: "ORD-1", id: "t1", totalCents: 999 })).toBe("TXN:ORD-1|ID:t1|TOTAL:999");
  });
});
