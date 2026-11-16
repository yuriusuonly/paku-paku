import { methodNotAllowed } from "../shared/network/response.js";

/**
 * HTTP method enforcement interceptor.
 * @module interceptors/method-interceptor
 */

/**
 * @typedef {import("../shared/network/middleware.js").ApiContext} ApiContext
 */

/**
 * Enforces allowed HTTP methods.
 *
 * @param {...string} methods - Allowed methods.
 * @returns {(context: ApiContext, next: () => Promise<Response>) => Promise<Response>} Middleware.
 */
export function methodInterceptor(...methods) {
  const allowed = methods.map((method) => method.toUpperCase());

  return async (context, next) => {
    if (!allowed.includes(context.method)) {
      return methodNotAllowed(allowed.join(", "));
    }
    return next();
  };
}
