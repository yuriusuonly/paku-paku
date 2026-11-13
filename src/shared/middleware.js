import { errorResponse } from "./response.js";
import { createContext } from "./context.js";

/**
 * Middleware pipeline for Expo Router API routes.
 * @module shared/middleware
 */

/**
 * @typedef {import("./context.js").ApiContext} ApiContext
 */

/**
 * @callback Middleware
 * @param {ApiContext} context - Request context.
 * @param {() => Promise<Response>} next - Invokes the next middleware/handler.
 * @returns {Promise<Response | void> | Response | void}
 */

/**
 * @callback ApiHandler
 * @param {ApiContext} context - Request context.
 * @returns {Promise<Response> | Response}
 */

/**
 * Composes middleware into a single runner around a terminal handler.
 *
 * @param {...Middleware} middlewares - Middleware functions in execution order.
 * @returns {(handler: ApiHandler) => (request: Request, routeContext?: {params?: Record<string, string>}) => Promise<Response>} Wrapped route handler factory.
 */
export function withMiddleware(...middlewares) {
  return (handler) => async (request, routeContext = {}) => {
    const context = createContext(request, {
      params: routeContext.params || {}
    });

    let index = -1;

    /**
     * Dispatches the next middleware or the terminal handler.
     *
     * @param {number} i - Middleware index.
     * @returns {Promise<Response>} Response.
     */
    const dispatch = async (i) => {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;

      const fn = i < middlewares.length ? middlewares[i] : handler;

      if (!fn) {
        return errorResponse(500, "internal_error", "No handler configured.");
      }

      const result = await fn(context, () => dispatch(i + 1));
      return result;
    };

    return dispatch(0);
  };
}
