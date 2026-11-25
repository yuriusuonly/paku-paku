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

describe("services/checkout", () => {
  test("placeOrder posts items with the guest token", async () => {
    const input = {
      payment_method: "card",
      items: [{ item_name: "Iced Matcha", quantity: 1, unit_price_cents: 700 }]
    };
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/checkout");
      expect(options.method).toBe("POST");
      expect(options.headers.Authorization).toBe("Bearer guest");
      expect(JSON.parse(options.body)).toEqual(input);
      return jsonResponse({ order: { id: "t1", qr_payload: "ORD:1|PAY:card" } }, 201);
    });

    const { placeOrder } = await import("../../services/checkout.js");
    await expect(placeOrder(input, "guest")).resolves.toEqual({
      order: { id: "t1", qr_payload: "ORD:1|PAY:card" }
    });
  });

  test("propagates API errors", async () => {
    globalThis.fetch = mock(async () =>
      jsonResponse({ error: { code: "invalid_checkout", message: "Invalid order." } }, 400)
    );
    const { placeOrder } = await import("../../services/checkout.js");
    await expect(placeOrder({ items: [] })).rejects.toEqual({
      status: 400,
      code: "invalid_checkout",
      message: "Invalid order."
    });
  });
});
