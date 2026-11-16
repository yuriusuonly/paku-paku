import { afterEach, describe, expect, mock, test } from "bun:test";

const originalFetch = globalThis.fetch;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("services/inventory", () => {
  test("getInventoryItems fetches admin inventory with token", async () => {
    const payload = { items: [{ id: "i1", name: "Rice" }] };
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/admin/inventory");
      expect(options.method).toBe("GET");
      expect(options.headers.Authorization).toBe("Bearer admin");
      return jsonResponse(payload);
    });
    const { getInventoryItems } = await import("../../src/services/inventory.js");
    await expect(getInventoryItems("admin")).resolves.toEqual(payload);
  });

  test("createInventoryItem posts payload", async () => {
    const input = { name: "Rice", quantity: 10 };
    const payload = { item: { id: "i1", ...input } };
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/admin/inventory");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toEqual(input);
      return jsonResponse(payload, 201);
    });
    const { createInventoryItem } = await import("../../src/services/inventory.js");
    await expect(createInventoryItem("admin", input)).resolves.toEqual(payload);
  });

  test("updateInventoryItem patches by id", async () => {
    const payload = { item: { id: "i1", quantity: 5 } };
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/admin/inventory/i1");
      expect(options.method).toBe("PATCH");
      expect(JSON.parse(options.body)).toEqual({ quantity: 5 });
      return jsonResponse(payload);
    });
    const { updateInventoryItem } = await import("../../src/services/inventory.js");
    await expect(updateInventoryItem("admin", "i1", { quantity: 5 })).resolves.toEqual(payload);
  });

  test("deleteInventoryItem deletes by id", async () => {
    const payload = { id: "i1" };
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/admin/inventory/i1");
      expect(options.method).toBe("DELETE");
      return jsonResponse(payload);
    });
    const { deleteInventoryItem } = await import("../../src/services/inventory.js");
    await expect(deleteInventoryItem("admin", "i1")).resolves.toEqual(payload);
  });
});
