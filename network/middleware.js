import { errorResponse } from "./response.js";
import { getBearerToken } from "./request.js";

/**
 * Middleware pipeline and request context for Expo Router API routes.
 * @module network/middleware
 */

/**
 * @typedef {object} ApiContext
 * @property {Request} request - Original web request.
 * @property {URL} url - Parsed request URL.
 * @property {string} method - Uppercase HTTP method.
 * @property {Record<string, string>} params - Route/path params when provided.
 * @property {string | null} bearerToken - Bearer token from Authorization header.
 * @property {any} body - Parsed JSON body when loaded by middleware.
 * @property {Record<string, any>} state - Mutable state shared across middleware/handlers.
 * @property {Record<string, any>} locals - Mutable per-request data bag (e.g. auth/profile/client).
 * @property {number} startedAt - Request start timestamp in milliseconds.
 */

/**
 * Creates the mutable context passed through the middleware pipeline.
 *
 * @param {Request} request - Incoming request.
 * @param {object} [options] - Context options.
 * @param {Record<string, string>} [options.params] - Route params.
 * @returns {ApiContext} Request context.
 */
export function createContext(request, { params = {} } = {}) {
  return {
    request,
    url: new URL(request.url),
    method: request.method.toUpperCase(),
    params,
    bearerToken: getBearerToken(request),
    body: undefined,
    state: {},
    locals: {},
    startedAt: Date.now()
  };
}

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
