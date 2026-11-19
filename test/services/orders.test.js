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

describe("services/orders (admin)", () => {
  test("getAdminOrders fetches with admin token", async () => {
    const payload = { orders: [{ id: "t1" }] };
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/admin/orders");
      expect(options.method).toBe("GET");
      expect(options.headers.Authorization).toBe("Bearer admin");
      return jsonResponse(payload);
    });
    const { getAdminOrders } = await import("../../src/services/orders.js");
    await expect(getAdminOrders("admin")).resolves.toEqual(payload);
  });

  test("createAdminOrder posts payload", async () => {
    const input = { items: [] };
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/admin/orders");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toEqual(input);
      return jsonResponse({ order: { id: "t1" } }, 201);
    });
    const { createAdminOrder } = await import("../../src/services/orders.js");
    await expect(createAdminOrder("admin", input)).resolves.toEqual({ order: { id: "t1" } });
  });

  test("updateAdminOrder patches by id", async () => {
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/admin/orders/t1");
      expect(options.method).toBe("PATCH");
      expect(JSON.parse(options.body)).toEqual({ status: "Paid" });
      return jsonResponse({ order: { id: "t1", status: "Paid" } });
    });
    const { updateAdminOrder } = await import("../../src/services/orders.js");
    await expect(updateAdminOrder("admin", "t1", { status: "Paid" })).resolves.toEqual({
      order: { id: "t1", status: "Paid" }
    });
  });

  test("deleteAdminOrder deletes by id", async () => {
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/admin/orders/t1");
      expect(options.method).toBe("DELETE");
      return jsonResponse({ id: "t1" });
    });
    const { deleteAdminOrder } = await import("../../src/services/orders.js");
    await expect(deleteAdminOrder("admin", "t1")).resolves.toEqual({ id: "t1" });
  });
});
