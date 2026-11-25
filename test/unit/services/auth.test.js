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

describe("services/auth", () => {
  test("signIn posts credentials to signin endpoint", async () => {
    const payload = { user: { id: "u1", role: "admin" }, session: { access_token: "a", refresh_token: "r" } };
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/signin");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toEqual({ email: "admin@example.com", password: "secret1" });
      return jsonResponse(payload, 200);
    });

    const { signIn } = await import("../../../services/auth.js");
    const result = await signIn({ email: "admin@example.com", password: "secret1" });
    expect(result).toEqual(payload);
  });

  test("getSession sends bearer token to session endpoint", async () => {
    const payload = { user: { id: "u1", role: "admin" } };
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/session");
      expect(options.method).toBe("GET");
      expect(options.headers.Authorization).toBe("Bearer token-123");
      return jsonResponse(payload, 200);
    });

    const { getSession } = await import("../../../services/auth.js");
    expect(await getSession("token-123")).toEqual(payload);
  });

  test("signOut posts with bearer token", async () => {
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/signout");
      expect(options.method).toBe("POST");
      expect(options.headers.Authorization).toBe("Bearer token-123");
      return new Response(null, { status: 204 });
    });

    const { signOut } = await import("../../../services/auth.js");
    expect(await signOut("token-123")).toBeNull();
  });

  test("propagates API errors", async () => {
    globalThis.fetch = mock(async () =>
      jsonResponse({ error: { code: "invalid_credentials", message: "Invalid email or password." } }, 401)
    );

    const { signIn } = await import("../../../services/auth.js");
    await expect(signIn({ email: "x", password: "y" })).rejects.toEqual({
      status: 401,
      code: "invalid_credentials",
      message: "Invalid email or password."
    });
  });
});
