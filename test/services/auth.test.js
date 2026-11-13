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
  test("signIn posts credentials to sign-in endpoint", async () => {
    const payload = { user: { id: "u1" }, session: { access_token: "a", refresh_token: "r" } };
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/sign-in");
      expect(options.method).toBe("POST");
      expect(options.headers["Content-Type"]).toBe("application/json");
      expect(JSON.parse(options.body)).toEqual({ username: "root", password: "root" });
      return jsonResponse(payload, 200);
    });

    const { signIn } = await import("../../src/services/auth.js");
    const result = await signIn({ username: "root", password: "root" });
    expect(result).toEqual(payload);
  });

  test("getSession sends bearer token to session endpoint", async () => {
    const payload = { user: { id: "u1", username: "root" } };
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/session");
      expect(options.method).toBe("GET");
      expect(options.headers.Authorization).toBe("Bearer token-123");
      return jsonResponse(payload, 200);
    });

    const { getSession } = await import("../../src/services/auth.js");
    const result = await getSession("token-123");
    expect(result).toEqual(payload);
  });

  test("signUp posts credentials to sign-up endpoint", async () => {
    const payload = { user: { id: "u2" }, session: null };
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/sign-up");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toEqual({ username: "alice", password: "secret1" });
      return jsonResponse(payload, 201);
    });

    const { signUp } = await import("../../src/services/auth.js");
    const result = await signUp({ username: "alice", password: "secret1" });
    expect(result).toEqual(payload);
  });

  test("signOut posts with bearer token", async () => {
    globalThis.fetch = mock(async (path, options) => {
      expect(path).toBe("/api/sign-out");
      expect(options.method).toBe("POST");
      expect(options.headers.Authorization).toBe("Bearer token-123");
      expect(options.body).toBeUndefined();
      return new Response(null, { status: 204 });
    });

    const { signOut } = await import("../../src/services/auth.js");
    const result = await signOut("token-123");
    expect(result).toBeNull();
  });

  test("propagates API errors", async () => {
    globalThis.fetch = mock(async () =>
      jsonResponse({ error: { code: "invalid_credentials", message: "Invalid username or password." } }, 401)
    );

    const { signIn } = await import("../../src/services/auth.js");
    await expect(signIn({ username: "x", password: "y" })).rejects.toEqual({
      status: 401,
      code: "invalid_credentials",
      message: "Invalid username or password."
    });
  });
});
