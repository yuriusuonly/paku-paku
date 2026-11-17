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
  test("placeOrder posts items and payment method without auth", async () => {
    const input = {
      payment_method: "gcash",
      items: [{ item_name: "Iced Matcha", quantity: 1, unit_price_cents: 700 }]
    };
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/checkout");
      expect(options.method).toBe("POST");
      expect(options.headers.Authorization).toBeUndefined();
      expect(JSON.parse(options.body)).toEqual(input);
      return jsonResponse({ transaction: { id: "t1", qr_payload: "TXN:1|PAY:gcash" } }, 201);
    });

    const { placeOrder } = await import("../../src/services/checkout.js");
    await expect(placeOrder(input)).resolves.toEqual({
      transaction: { id: "t1", qr_payload: "TXN:1|PAY:gcash" }
    });
  });

  test("propagates API errors", async () => {
    globalThis.fetch = mock(async () =>
      jsonResponse({ error: { code: "invalid_checkout", message: "Invalid order." } }, 400)
    );
    const { placeOrder } = await import("../../src/services/checkout.js");
    await expect(placeOrder({ items: [] })).rejects.toEqual({
      status: 400,
      code: "invalid_checkout",
      message: "Invalid order."
    });
  });
});
