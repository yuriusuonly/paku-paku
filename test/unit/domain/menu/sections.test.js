import { describe, expect, test } from "bun:test";
import { getMenuSections } from "../../../../domain/menu/sections.js";

/**
 * Tests for storefront menu section rules.
 * @module test/unit/domain/menu/sections
 */

describe("getMenuSections", () => {
  const items = [
    { id: "1", name: "Green tea", sort_order: 20, is_available: true },
    { id: "2", name: "Chicken Teriyaki", sort_order: 220, is_available: true },
    { id: "4", name: "Red tea", sort_order: 10, is_available: true },
    { id: "5", name: "Hidden", sort_order: 210, is_available: false }
  ];

  test("groups items into food and beverage sections", () => {
    const sections = getMenuSections(items);
    expect(sections.map((section) => section.key)).toEqual(["food", "beverage"]);
    expect(sections[0].items.map((item) => item.name)).toEqual(["Chicken Teriyaki"]);
    expect(sections[1].items.map((item) => item.name)).toEqual(["Red tea", "Green tea"]);
  });

  test("omits empty sections and unavailable items", () => {
    const sections = getMenuSections([{ id: "1", name: "Tea", sort_order: 10, is_available: true }]);
    expect(sections.map((section) => section.key)).toEqual(["beverage"]);
  });
});
