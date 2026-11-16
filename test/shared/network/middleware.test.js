import { describe, expect, test } from "bun:test";
import { createContext, withMiddleware } from "../../../src/shared/network/middleware.js";
import { jsonResponse } from "../../../src/shared/network/response.js";

/**
 * Integration tests for middleware pipeline composition.
 * @module test/shared/network/middleware
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

  test("returns 500-style error when no terminal handler is provided", async () => {
    const route = withMiddleware()(undefined);
    const response = await route(new Request("http://localhost/api/x"));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: { code: "internal_error", message: "No handler configured." } });
  });
});
