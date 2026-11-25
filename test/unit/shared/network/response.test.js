import { describe, expect, test } from "bun:test";
import { errorResponse, jsonResponse, methodNotAllowed, noContent } from "../../../../network/response.js";

/**
 * Tests for response helpers.
 * @module test/unit/shared/network/response
 */

describe("jsonResponse", () => {
  test("returns JSON with no-store and custom headers", async () => {
    const response = jsonResponse({ ok: true }, { status: 201, headers: { "X-Test": "1" } });
    expect(response.status).toBe(201);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("X-Test")).toBe("1");
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});

describe("errorResponse", () => {
  test("wraps code/message in standard error envelope", async () => {
    const response = errorResponse(400, "bad", "Bad request", { headers: { "X-E": "y" } });
    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("X-E")).toBe("y");
    await expect(response.json()).resolves.toEqual({ error: { code: "bad", message: "Bad request" } });
  });
});

describe("methodNotAllowed", () => {
  test("returns 405 with Allow header and message", async () => {
    const response = methodNotAllowed("GET, POST");
    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("GET, POST");
    await expect(response.json()).resolves.toEqual({
      error: { code: "method_not_allowed", message: "Use GET, POST." }
    });
  });
});

describe("noContent", () => {
  test("returns 204 with no-store and empty body", async () => {
    const response = noContent();
    expect(response.status).toBe(204);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.text()).toBe("");
  });
});
