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

describe("services/transactions (admin)", () => {
  test("getAdminTransactions fetches with admin token", async () => {
    const payload = { transactions: [{ id: "t1" }] };
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/admin/transactions");
      expect(options.method).toBe("GET");
      expect(options.headers.Authorization).toBe("Bearer admin");
      return jsonResponse(payload);
    });
    const { getAdminTransactions } = await import("../../src/services/transactions.js");
    await expect(getAdminTransactions("admin")).resolves.toEqual(payload);
  });

  test("createAdminTransaction posts payload", async () => {
    const input = { kind: "sell", items: [] };
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/admin/transactions");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toEqual(input);
      return jsonResponse({ transaction: { id: "t1" } }, 201);
    });
    const { createAdminTransaction } = await import("../../src/services/transactions.js");
    await expect(createAdminTransaction("admin", input)).resolves.toEqual({ transaction: { id: "t1" } });
  });

  test("updateAdminTransaction patches by id", async () => {
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/admin/transactions/t1");
      expect(options.method).toBe("PATCH");
      expect(JSON.parse(options.body)).toEqual({ status: "completed" });
      return jsonResponse({ transaction: { id: "t1", status: "completed" } });
    });
    const { updateAdminTransaction } = await import("../../src/services/transactions.js");
    await expect(updateAdminTransaction("admin", "t1", { status: "completed" })).resolves.toEqual({
      transaction: { id: "t1", status: "completed" }
    });
  });

  test("deleteAdminTransaction deletes by id", async () => {
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/admin/transactions/t1");
      expect(options.method).toBe("DELETE");
      return jsonResponse({ id: "t1" });
    });
    const { deleteAdminTransaction } = await import("../../src/services/transactions.js");
    await expect(deleteAdminTransaction("admin", "t1")).resolves.toEqual({ id: "t1" });
  });
});
