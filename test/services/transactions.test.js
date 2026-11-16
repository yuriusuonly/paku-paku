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

describe("services/transactions", () => {
  test("getMyTransactions fetches customer transactions with token", async () => {
    const payload = { transactions: [{ id: "t1" }] };
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/transactions");
      expect(options.method).toBe("GET");
      expect(options.headers.Authorization).toBe("Bearer tok");
      return jsonResponse(payload);
    });
    const { getMyTransactions } = await import("../../src/services/transactions.js");
    await expect(getMyTransactions("tok")).resolves.toEqual(payload);
  });

  test("createTransaction posts buy transaction payload", async () => {
    const input = { kind: "buy", items: [{ menu_item_id: "m1", quantity: 2 }] };
    const payload = { transaction: { id: "t1", ...input } };
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/transactions");
      expect(options.method).toBe("POST");
      expect(options.headers.Authorization).toBe("Bearer tok");
      expect(JSON.parse(options.body)).toEqual(input);
      return jsonResponse(payload, 201);
    });
    const { createTransaction } = await import("../../src/services/transactions.js");
    await expect(createTransaction("tok", input)).resolves.toEqual(payload);
  });

  test("getTransaction and updateTransaction target transaction by id", async () => {
    const { getTransaction, updateTransaction } = await import("../../src/services/transactions.js");

    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/transactions/t1");
      expect(options.method).toBe("GET");
      return jsonResponse({ transaction: { id: "t1" } });
    });
    await expect(getTransaction("tok", "t1")).resolves.toEqual({ transaction: { id: "t1" } });

    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/transactions/t1");
      expect(options.method).toBe("PATCH");
      expect(JSON.parse(options.body)).toEqual({ status: "confirmed" });
      return jsonResponse({ transaction: { id: "t1", status: "confirmed" } });
    });
    await expect(updateTransaction("tok", "t1", { status: "confirmed" })).resolves.toEqual({ transaction: { id: "t1", status: "confirmed" } });
  });

  test("admin transaction endpoints use admin routes and methods", async () => {
    const { getAdminTransactions, createAdminTransaction, updateAdminTransaction, deleteAdminTransaction } = await import("../../src/services/transactions.js");

    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/admin/transactions");
      expect(options.method).toBe("GET");
      return jsonResponse({ transactions: [] });
    });
    await expect(getAdminTransactions("admin")).resolves.toEqual({ transactions: [] });

    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/admin/transactions");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toEqual({ kind: "sell" });
      return jsonResponse({ transaction: { id: "a1" } }, 201);
    });
    await expect(createAdminTransaction("admin", { kind: "sell" })).resolves.toEqual({ transaction: { id: "a1" } });

    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/admin/transactions/a1");
      expect(options.method).toBe("PATCH");
      expect(JSON.parse(options.body)).toEqual({ status: "completed" });
      return jsonResponse({ transaction: { id: "a1", status: "completed" } });
    });
    await expect(updateAdminTransaction("admin", "a1", { status: "completed" })).resolves.toEqual({ transaction: { id: "a1", status: "completed" } });

    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/admin/transactions/a1");
      expect(options.method).toBe("DELETE");
      return jsonResponse({ id: "a1" });
    });
    await expect(deleteAdminTransaction("admin", "a1")).resolves.toEqual({ id: "a1" });
  });

  test("propagates API errors", async () => {
    globalThis.fetch = mock(async () => jsonResponse({ error: { code: "not_found", message: "Missing" } }, 404));
    const { getTransaction } = await import("../../src/services/transactions.js");
    await expect(getTransaction("tok", "bad")).rejects.toEqual({ status: 404, code: "not_found", message: "Missing" });
  });
});
