import { describe, expect, test } from "bun:test";
import { getMenuSections } from "../../../src/domain/menu/sections.js";

/**
 * Tests for storefront menu section rules.
 * @module test/domain/menu/sections
 */

describe("getMenuSections", () => {
  const items = [
    { id: "1", name: "Green tea", sort_order: 20, is_available: true },
    { id: "2", name: "Karaage & Green Tea Combo", sort_order: 100, is_available: true },
    { id: "3", name: "Karaage", sort_order: 200, is_available: true },
    { id: "4", name: "Macha", sort_order: 30, is_available: true },
    { id: "5", name: "Hidden", sort_order: 210, is_available: false }
  ];

  test("groups items into combo, food, and beverage sections", () => {
    const sections = getMenuSections(items);
    expect(sections.map((section) => section.key)).toEqual(["combo", "food", "beverage"]);
    expect(sections[0].items.map((item) => item.name)).toEqual(["Karaage & Green Tea Combo"]);
    expect(sections[1].items.map((item) => item.name)).toEqual(["Karaage"]);
    expect(sections[2].items.map((item) => item.name)).toEqual(["Green tea", "Macha"]);
  });

  test("omits empty sections and unavailable items", () => {
    const sections = getMenuSections([{ id: "1", name: "Tea", sort_order: 10, is_available: true }]);
    expect(sections.map((section) => section.key)).toEqual(["beverage"]);
  });
});
