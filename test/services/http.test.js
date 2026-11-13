import { afterEach, describe, expect, mock, test } from "bun:test";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("network/http apiRequest", () => {
  test("maps network failures to a normalized error", async () => {
    globalThis.fetch = mock(async () => {
      throw new Error("offline");
    });

    const { apiRequest } = await import("../../src/network/http.js");
    await expect(apiRequest("/api/health")).rejects.toEqual({
      status: 0,
      code: "network_error",
      message: "Unable to reach the server."
    });
  });

  test("returns null for 204 responses", async () => {
    globalThis.fetch = mock(async () => new Response(null, { status: 204 }));
    const { apiRequest } = await import("../../src/network/http.js");
    expect(await apiRequest("/api/auth/sign-out", { method: "POST" })).toBeNull();
  });
});
