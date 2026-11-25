import { describe, expect, test } from "bun:test";
import { getBearerToken, readJsonBody } from "../../../../shared/network/request.js";

/**
 * Tests for request parsing helpers.
 * @module test/unit/shared/network/request
 */

describe("readJsonBody", () => {
  test("returns parsed object for valid JSON object bodies", async () => {
    const request = new Request("http://localhost/api/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ a: 1, nested: { ok: true } })
    });
    await expect(readJsonBody(request)).resolves.toEqual({ a: 1, nested: { ok: true } });
  });

  test("returns null for arrays, primitives, empty bodies, and invalid JSON", async () => {
    const cases = [
      new Request("http://localhost/api/test", { method: "POST", body: JSON.stringify([1, 2]) }),
      new Request("http://localhost/api/test", { method: "POST", body: JSON.stringify("x") }),
      new Request("http://localhost/api/test", { method: "POST", body: "{" }),
      new Request("http://localhost/api/test", { method: "POST" })
    ];
    for (const request of cases) {
      await expect(readJsonBody(request)).resolves.toBeNull();
    }
  });
});

describe("getBearerToken", () => {
  test("extracts bearer token case-insensitively", () => {
    expect(getBearerToken(new Request("http://localhost", { headers: { Authorization: "Bearer abc123" } }))).toBe("abc123");
    expect(getBearerToken(new Request("http://localhost", { headers: { Authorization: "bearer tok.en" } }))).toBe("tok.en");
  });

  test("returns null for missing, malformed, or non-bearer headers", () => {
    const cases = [
      new Request("http://localhost"),
      new Request("http://localhost", { headers: { Authorization: "Basic abc" } }),
      new Request("http://localhost", { headers: { Authorization: "Bearer" } }),
      new Request("http://localhost", { headers: { Authorization: "Bearer    " } }),
      new Request("http://localhost", { headers: { Authorization: "" } })
    ];
    for (const request of cases) {
      expect(getBearerToken(request)).toBeNull();
    }
  });
});
