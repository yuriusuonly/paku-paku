import {
  describe,
  expect,
  spyOn,
  test
} from "bun:test";
import { badRequest } from "../../../lib/errors/bad-request.js";
import { errorInterceptor } from "../../../src/interceptors/error.interceptor.js";
import { logInterceptor } from "../../../src/interceptors/log.interceptor.js";
import { methodInterceptor } from "../../../src/interceptors/method.interceptor.js";
import { createContext, withMiddleware } from "../../../src/network/middleware.js";
import { readJsonBody } from "../../../src/network/request.js";
import { jsonResponse } from "../../../src/network/response.js";

/**
 * Integration tests for middleware pipeline composition.
 * @module test/network/middleware
 */

describe("createContext", () => {
  test("builds request context with parsed url, method, token, params, and mutable bags", () => {
    const request = new Request("http://localhost/api/items?id=1", {
      method: "post",
      headers: { Authorization: "Bearer tok" }
    });
    const context = createContext(request, { params: { id: "1" } });
    expect(context.request).toBe(request);
    expect(context.url.pathname).toBe("/api/items");
    expect(context.url.searchParams.get("id")).toBe("1");
    expect(context.method).toBe("POST");
    expect(context.params).toEqual({ id: "1" });
    expect(context.bearerToken).toBe("tok");
    expect(context.body).toBeUndefined();
    expect(context.state).toEqual({});
    expect(context.locals).toEqual({});
    expect(typeof context.startedAt).toBe("number");
  });
});

describe("withMiddleware", () => {
  test("runs middleware in order and passes context/state to terminal handler", async () => {
    const calls = [];
    const mw1 = async (context, next) => {
      calls.push("mw1-before");
      context.state.trace = ["mw1"];
      const res = await next();
      calls.push("mw1-after");
      return res;
    };
    const mw2 = async (context, next) => {
      calls.push("mw2-before");
      context.state.trace.push("mw2");
      context.locals.user = { id: "u1" };
      return next();
    };
    const handler = async (context) => {
      calls.push("handler");
      return jsonResponse({ trace: context.state.trace, user: context.locals.user, method: context.method }, { status: 200 });
    };

    const route = withMiddleware(mw1, mw2)(handler);
    const response = await route(new Request("http://localhost/api/x", { method: "GET" }), { params: {} });
    expect(calls).toEqual(["mw1-before", "mw2-before", "handler", "mw1-after"]);
    await expect(response.json()).resolves.toEqual({ trace: ["mw1", "mw2"], user: { id: "u1" }, method: "GET" });
  });

  test("allows middleware to short-circuit without calling next", async () => {
    let handlerCalled = false;
    const auth = async () => jsonResponse({ error: { code: "unauthorized" } }, { status: 401 });
    const handler = async () => {
      handlerCalled = true;
      return jsonResponse({ ok: true });
    };
    const route = withMiddleware(auth)(handler);
    const response = await route(new Request("http://localhost/api/x"));
    expect(handlerCalled).toBe(false);
    expect(response.status).toBe(401);
  });

  test("injects route params into context", async () => {
    const handler = async (context) => jsonResponse({ params: context.params });
    const route = withMiddleware()(handler);
    const response = await route(new Request("http://localhost/api/items/42"), { params: { id: "42" } });
    await expect(response.json()).resolves.toEqual({ params: { id: "42" } });
  });

  test("throws when next() is called multiple times", async () => {
    const bad = async (_context, next) => {
      await next();
      await next();
      return jsonResponse({ ok: true });
    };
    const route = withMiddleware(bad)(async () => jsonResponse({ ok: true }));
    await expect(route(new Request("http://localhost/api/x"))).rejects.toThrow("next() called multiple times");
  });

  test("maps unexpected errors to a generic 500 without leaking details", async () => {
    const log = spyOn(console, "error").mockImplementation(() => {});

    try {
      const route = withMiddleware(errorInterceptor)(async () => {
        throw new Error("SECRET-INTERNAL-DETAIL");
      });
      const response = await route(new Request("http://localhost/api/x"));

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: {
          code: "internal_error",
          message: "An unexpected error occurred."
        }
      });
      expect(JSON.stringify(log.mock.calls)).not.toContain("SECRET-INTERNAL-DETAIL");
    } finally {
      log.mockRestore();
    }
  });

  test("returns 500-style error when no terminal handler is provided", async () => {
    const route = withMiddleware()(undefined);
    const response = await route(new Request("http://localhost/api/x"));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: { code: "internal_error", message: "No handler configured." } });
  });
});

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
