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

describe("services/account", () => {
  test("getMyAccount fetches authenticated account profile", async () => {
    const payload = { profile: { id: "u1", email: "a@b.c" } };
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/account/profile");
      expect(options.method).toBe("GET");
      expect(options.headers.Authorization).toBe("Bearer tok");
      return jsonResponse(payload);
    });
    const { getMyAccount } = await import("../../src/services/account.js");
    await expect(getMyAccount("tok")).resolves.toEqual(payload);
  });

  test("changeMyPassword patches password for authenticated account", async () => {
    const payload = { profile: { id: "u1" } };
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/account/profile");
      expect(options.method).toBe("PATCH");
      expect(options.headers.Authorization).toBe("Bearer tok");
      expect(JSON.parse(options.body)).toEqual({ password: "new-pass" });
      return jsonResponse(payload);
    });
    const { changeMyPassword } = await import("../../src/services/account.js");
    await expect(changeMyPassword("tok", "new-pass")).resolves.toEqual(payload);
  });

  test("propagates unauthorized errors", async () => {
    globalThis.fetch = mock(async () => jsonResponse({ error: { code: "unauthorized", message: "Auth required" } }, 401));
    const { getMyAccount } = await import("../../src/services/account.js");
    await expect(getMyAccount("bad")).rejects.toEqual({ status: 401, code: "unauthorized", message: "Auth required" });
  });
});
