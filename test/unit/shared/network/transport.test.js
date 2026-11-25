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

describe("shared/network/transport apiRequest", () => {
  test("sends JSON body and bearer token headers", async () => {
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/items");
      expect(options.method).toBe("POST");
      expect(options.headers.Accept).toBe("application/json");
      expect(options.headers["Content-Type"]).toBe("application/json");
      expect(options.headers.Authorization).toBe("Bearer token-1");
      expect(options.body).toBe(JSON.stringify({ name: "A" }));
      return jsonResponse({ ok: true }, 200);
    });

    const { apiRequest } = await import("../../../../shared/network/transport.js");
    await expect(apiRequest("/api/items", { method: "POST", body: { name: "A" }, token: "token-1" })).resolves.toEqual({ ok: true });
  });

  test("omits content-type/body when no body and omits auth when no token", async () => {
    globalThis.fetch = mock(async (_path, options) => {
      expect(options.method).toBe("GET");
      expect(options.headers["Content-Type"]).toBeUndefined();
      expect(options.headers.Authorization).toBeUndefined();
      expect(options.body).toBeUndefined();
      return jsonResponse({ items: [] }, 200);
    });

    const { apiRequest } = await import("../../../../shared/network/transport.js");
    await expect(apiRequest("/api/items")).resolves.toEqual({ items: [] });
  });

  test("returns null for 204 responses", async () => {
    globalThis.fetch = mock(async () => new Response(null, { status: 204 }));
    const { apiRequest } = await import("../../../../shared/network/transport.js");
    await expect(apiRequest("/api/signout", { method: "POST" })).resolves.toBeNull();
  });

  test("throws normalized error for non-ok JSON error payloads", async () => {
    globalThis.fetch = mock(async () => jsonResponse({ error: { code: "forbidden", message: "Nope" } }, 403));
    const { apiRequest } = await import("../../../../shared/network/transport.js");
    await expect(apiRequest("/api/admin")).rejects.toEqual({ status: 403, code: "forbidden", message: "Nope" });
  });

  test("throws fallback normalized error for non-ok non-JSON responses", async () => {
    globalThis.fetch = mock(async () => new Response("bad", { status: 500, headers: { "Content-Type": "text/plain" } }));
    const { apiRequest } = await import("../../../../shared/network/transport.js");
    await expect(apiRequest("/api/x")).rejects.toEqual({ status: 500, code: "request_failed", message: "The request could not be completed." });
  });

  test("maps network failures to network_error", async () => {
    globalThis.fetch = mock(async () => {
      throw new Error("offline");
    });
    const { apiRequest } = await import("../../../../shared/network/transport.js");
    await expect(apiRequest("/api/health")).rejects.toEqual({ status: 0, code: "network_error", message: "Unable to reach the server." });
  });
});
