import { describe, expect, spyOn, test } from "bun:test";
import { errorInterceptor } from "../../src/interceptors/error.interceptor.js";
import { logInterceptor } from "../../src/interceptors/log.interceptor.js";
import { methodInterceptor } from "../../src/interceptors/method.interceptor.js";
import { badRequest } from "../../src/shared/errors/bad-request.js";
import { withMiddleware } from "../../src/shared/network/middleware.js";
import { readJsonBody } from "../../src/shared/network/request.js";
import { jsonResponse } from "../../src/shared/network/response.js";

/**
 * Integration tests for composed endpoint-style middleware flows.
 * @module test/integration/middleware-endpoint
 */

describe("composed endpoint flow", () => {
  test("parses JSON, validates input, calls handler logic, and returns success envelope", async () => {
    const route = withMiddleware(
      logInterceptor,
      errorInterceptor,
      methodInterceptor("POST")
    )(async (context) => {
      const body = await readJsonBody(context.request);
      if (!body || typeof body.email !== "string" || !body.email.includes("@")) {
        throw badRequest("invalid_email", "Enter a valid email address.");
      }
      return jsonResponse({ ok: true, email: body.email.trim().toLowerCase() }, { status: 201 });
    });

    const response = await route(new Request("http://localhost/api/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "  User@Example.com " })
    }));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ ok: true, email: "user@example.com" });
  });

  test("maps thrown app errors through error interceptor", async () => {
    const route = withMiddleware(logInterceptor, errorInterceptor, methodInterceptor("POST"))(async () => {
      throw badRequest("invalid_body", "Expected a JSON object.");
    });

    const response = await route(new Request("http://localhost/api/test", { method: "POST" }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: { code: "invalid_body", message: "Expected a JSON object." } });
  });

  test("rejects disallowed methods with Allow header", async () => {
    const route = withMiddleware(logInterceptor, errorInterceptor, methodInterceptor("GET"))(async () => jsonResponse({ ok: true }));
    const response = await route(new Request("http://localhost/api/test", { method: "POST" }));
    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("GET");
    await expect(response.json()).resolves.toEqual({ error: { code: "method_not_allowed", message: "Use GET." } });
  });

  test("does not log error causes", async () => {
    const warn = spyOn(console, "warn").mockImplementation(() => {});
    const secret = "SECRET-UPSTREAM-DETAIL";
    try {
      const route = withMiddleware(errorInterceptor)(async () => {
        const error = badRequest("invalid_request", "Invalid request.");
        error.cause = secret;
        throw error;
      });
      const response = await route(new Request("http://localhost/api/test"));
      expect(response.status).toBe(400);
      expect(JSON.stringify(warn.mock.calls)).not.toContain(secret);
    } finally {
      warn.mockRestore();
    }
  });
});
