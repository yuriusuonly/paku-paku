import { describe, expect, test } from "bun:test";
import { sortByCreatedDesc, sortByOrder, sortByString } from "../../../../src/shared/utils/lists.js";

/**
 * Tests for list sorting helpers.
 * @module test/unit/shared/utils/lists
 */

describe("sortByOrder", () => {
  test("sorts by sort_order then name without mutating input", () => {
    const items = [
      { name: "B", sort_order: 2 },
      { name: "A", sort_order: 2 },
      { name: "C", sort_order: 1 }
    ];
    expect(sortByOrder(items).map((item) => item.name)).toEqual(["C", "A", "B"]);
    expect(items[0].name).toBe("B");
  });
});

describe("sortByString", () => {
  test("sorts by the requested string field", () => {
    const items = [{ email: "b@x" }, { email: "a@x" }];
    expect(sortByString(items, "email").map((item) => item.email)).toEqual(["a@x", "b@x"]);
  });
});

describe("sortByCreatedDesc", () => {
  test("sorts by created_at newest first", () => {
    const items = [
      { id: 1, created_at: "2026-01-01T00:00:00.000Z" },
      { id: 2, created_at: "2026-03-01T00:00:00.000Z" },
      { id: 3, created_at: "2026-02-01T00:00:00.000Z" }
    ];
    expect(sortByCreatedDesc(items).map((item) => item.id)).toEqual([2, 3, 1]);
  });
});
