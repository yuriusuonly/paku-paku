import { authenticate } from "../repositories/auth.repository.js";

/**
 * Authentication interceptor.
 * @module interceptors/authentication.interceptor
 */

/**
 * @typedef {import("../shared/network/middleware.js").ApiContext} ApiContext
 */

/**
 * Authenticates the request and stores auth data in `context.locals.auth`.
 *
 * @param {ApiContext} context - Request context.
 * @param {() => Promise<Response>} next - Next middleware/handler.
 * @returns {Promise<Response>} Response.
 */
export async function authenticationInterceptor(context, next) {
  context.locals.auth = await authenticate(context.request);
  return next();
}
