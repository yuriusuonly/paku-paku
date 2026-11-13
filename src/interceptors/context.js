import { getBearerToken } from "../shared/request.js";

/**
 * Request context creation for the API middleware pipeline.
 * @module interceptors/context
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
