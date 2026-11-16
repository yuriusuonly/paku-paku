import { describe, expect, test } from "bun:test";
import { formatAuditTimestamp } from "../../../src/shared/format/date.js";

/**
 * Tests for audit timestamp formatting.
 * @module test/shared/format/date
 */

describe("formatAuditTimestamp", () => {
  test("returns dash for empty-ish values", () => {
    expect(formatAuditTimestamp(null)).toBe("-");
    expect(formatAuditTimestamp(undefined)).toBe("-");
    expect(formatAuditTimestamp("")).toBe("-");
    expect(formatAuditTimestamp(0)).toBe("-");
    expect(formatAuditTimestamp(false)).toBe("-");
  });

  test("formats valid ISO date strings", () => {
    const value = "2026-11-16T12:34:56.000Z";
    const result = formatAuditTimestamp(value);
    expect(result).toBe(new Date(value).toLocaleString());
    expect(result).not.toBe("-");
    expect(result).not.toBe(value);
  });

  test("formats valid Date instances", () => {
    const value = new Date("2026-01-02T03:04:05.000Z");
    expect(formatAuditTimestamp(value)).toBe(value.toLocaleString());
  });

  test("formats numeric timestamps", () => {
    const value = Date.UTC(2026, 0, 15, 8, 30, 0);
    expect(formatAuditTimestamp(value)).toBe(new Date(value).toLocaleString());
  });

  test("returns original string for invalid date strings", () => {
    expect(formatAuditTimestamp("not-a-date")).toBe("not-a-date");
    expect(formatAuditTimestamp("2026-99-99")).toBe("2026-99-99");
  });
});
