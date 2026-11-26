import { describe, expect, test } from "bun:test";
import { getAuditActor, getAuditSummary } from "../../../../src/domain/audit/summary.js";

/**
 * Tests for audit presentation helpers.
 * @module test/domain/audit/summary
 */

describe("audit summary helpers", () => {
  test("summarizes item, order, profile, and order item logs", () => {
    expect(getAuditSummary({ table_name: "items", after_data: { name: "Iced Matcha" } })).toBe("Iced Matcha");
    expect(getAuditSummary({ table_name: "orders", after_data: { order_number: "ORD-1" } })).toBe("ORD-1");
    expect(getAuditSummary({ table_name: "profiles", before_data: { email: "a@b.co" } })).toBe("a@b.co");
    expect(getAuditSummary({ table_name: "order_items", after_data: { item_name: "Ramen" } })).toBe("Ramen");
  });

  test("falls back to kiosk actor", () => {
    expect(getAuditActor({ actor_email: "admin@paku-paku.official" })).toBe("admin@paku-paku.official");
    expect(getAuditActor({})).toBe("kiosk");
  });
});
