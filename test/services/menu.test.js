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

describe("services/menu", () => {
  test("getMenuItems fetches menu with bearer token", async () => {
    const payload = { items: [{ id: "m1", name: "Ramen" }] };
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/menu-items");
      expect(options.method).toBe("GET");
      expect(options.headers.Authorization).toBe("Bearer t");
      return jsonResponse(payload, 200);
    });

    const { getMenuItems } = await import("../../src/services/menu.js");
    expect(await getMenuItems("t")).toEqual(payload);
  });

  test("createMenuItem posts item payload", async () => {
    const input = { name: "Ramen", price_cents: 1200 };
    const payload = { item: { id: "m1", ...input } };
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/menu-items");
      expect(options.method).toBe("POST");
      expect(options.headers.Authorization).toBe("Bearer admin");
      expect(JSON.parse(options.body)).toEqual(input);
      return jsonResponse(payload, 201);
    });

    const { createMenuItem } = await import("../../src/services/menu.js");
    expect(await createMenuItem("admin", input)).toEqual(payload);
  });

  test("updateMenuItem patches item by id", async () => {
    const payload = { item: { id: "m1", name: "New" } };
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/menu-items/m1");
      expect(options.method).toBe("PATCH");
      expect(options.headers.Authorization).toBe("Bearer admin");
      expect(JSON.parse(options.body)).toEqual({ name: "New" });
      return jsonResponse(payload, 200);
    });

    const { updateMenuItem } = await import("../../src/services/menu.js");
    expect(await updateMenuItem("admin", "m1", { name: "New" })).toEqual(payload);
  });

  test("deleteMenuItem deletes item by id", async () => {
    const payload = { id: "m1" };
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/menu-items/m1");
      expect(options.method).toBe("DELETE");
      expect(options.headers.Authorization).toBe("Bearer admin");
      return jsonResponse(payload, 200);
    });

    const { deleteMenuItem } = await import("../../src/services/menu.js");
    expect(await deleteMenuItem("admin", "m1")).toEqual(payload);
  });
});
