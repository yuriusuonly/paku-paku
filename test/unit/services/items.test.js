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

describe("services/items", () => {
  test("getItems fetches the public menu without a token", async () => {
    const payload = { items: [{ id: "m1", name: "Iced Matcha" }] };
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/items");
      expect(options.method).toBe("GET");
      expect(options.headers.Authorization).toBeUndefined();
      return jsonResponse(payload, 200);
    });

    const { getItems } = await import("../../../services/items.js");
    expect(await getItems()).toEqual(payload);
  });

  test("createItem posts item payload", async () => {
    const input = { name: "Ramen", price_cents: 1200 };
    const payload = { item: { id: "m1", ...input } };
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/items");
      expect(options.method).toBe("POST");
      expect(options.headers.Authorization).toBe("Bearer admin");
      expect(JSON.parse(options.body)).toEqual(input);
      return jsonResponse(payload, 201);
    });

    const { createItem } = await import("../../../services/items.js");
    expect(await createItem("admin", input)).toEqual(payload);
  });

  test("updateItem patches item by id", async () => {
    const payload = { item: { id: "m1", name: "New" } };
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/items/m1");
      expect(options.method).toBe("PATCH");
      expect(options.headers.Authorization).toBe("Bearer admin");
      expect(JSON.parse(options.body)).toEqual({ name: "New" });
      return jsonResponse(payload, 200);
    });

    const { updateItem } = await import("../../../services/items.js");
    expect(await updateItem("admin", "m1", { name: "New" })).toEqual(payload);
  });

  test("deleteItem deletes item by id", async () => {
    const payload = { id: "m1" };
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/items/m1");
      expect(options.method).toBe("DELETE");
      expect(options.headers.Authorization).toBe("Bearer admin");
      return jsonResponse(payload, 200);
    });

    const { deleteItem } = await import("../../../services/items.js");
    expect(await deleteItem("admin", "m1")).toEqual(payload);
  });
});
