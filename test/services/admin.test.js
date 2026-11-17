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

describe("services/admin", () => {
  test("getProfiles fetches admin profiles with bearer token", async () => {
    const payload = { profiles: [{ id: "p1", email: "root@paku-paku.official", role: "admin" }] };
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/admin/profiles");
      expect(options.method).toBe("GET");
      expect(options.headers.Authorization).toBe("Bearer admin-token");
      return jsonResponse(payload, 200);
    });

    const { getProfiles } = await import("../../src/services/admin.js");
    expect(await getProfiles("admin-token")).toEqual(payload);
  });

  test("propagates forbidden errors", async () => {
    globalThis.fetch = mock(async () =>
      jsonResponse({ error: { code: "forbidden", message: "Administrator access required." } }, 403)
    );

    const { getProfiles } = await import("../../src/services/admin.js");
    await expect(getProfiles("user-token")).rejects.toEqual({
      status: 403,
      code: "forbidden",
      message: "Administrator access required."
    });
  });
});
