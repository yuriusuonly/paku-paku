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

describe("services/staff", () => {
  test("getStaffOrders fetches order logs with staff token", async () => {
    const payload = { orders: [{ id: "o1", order_number: "ORD-1" }] };
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/staff/orders");
      expect(options.method).toBe("GET");
      expect(options.headers.Authorization).toBe("Bearer staff");
      return jsonResponse(payload);
    });
    const { getStaffOrders } = await import("../../src/services/staff.js");
    await expect(getStaffOrders("staff")).resolves.toEqual(payload);
  });

  test("createStaffOrder posts a manual order with staff token", async () => {
    const input = { status: "Paid", items: [{ item_name: "Green tea", quantity: 1, unit_price_cents: 2500 }] };
    const payload = { order: { id: "o1", order_number: "ORD-1" } };
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/staff/orders");
      expect(options.method).toBe("POST");
      expect(options.headers.Authorization).toBe("Bearer staff");
      expect(JSON.parse(options.body)).toEqual(input);
      return jsonResponse(payload, 201);
    });
    const { createStaffOrder } = await import("../../src/services/staff.js");
    await expect(createStaffOrder("staff", input)).resolves.toEqual(payload);
  });

  test("verifyOrder posts the QR reference with staff token", async () => {
    const payload = { order: { id: "o1", order_number: "ORD-1" } };
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/staff/orders/verify");
      expect(options.method).toBe("POST");
      expect(options.headers.Authorization).toBe("Bearer staff");
      expect(JSON.parse(options.body)).toEqual({ reference: "ORD-1" });
      return jsonResponse(payload);
    });
    const { verifyOrder } = await import("../../src/services/staff.js");
    await expect(verifyOrder("staff", "ORD-1")).resolves.toEqual(payload);
  });

  test("updateOrderStatus patches status by id", async () => {
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/staff/orders/o1");
      expect(options.method).toBe("PATCH");
      expect(JSON.parse(options.body)).toEqual({ status: "Paid" });
      return jsonResponse({ order: { id: "o1", status: "Paid" } });
    });
    const { updateOrderStatus } = await import("../../src/services/staff.js");
    await expect(updateOrderStatus("staff", "o1", "Paid")).resolves.toEqual({ order: { id: "o1", status: "Paid" } });
  });
});
