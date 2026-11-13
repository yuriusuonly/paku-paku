import { authenticateAdmin } from "../repositories/auth-repository.js";

/**
 * Authorization interceptor.
 * @module interceptors/authorization-interceptor
 */

/**
 * @typedef {import("./context.js").ApiContext} ApiContext
 */

/**
 * Requires an authenticated administrator and stores auth data in `context.locals.auth`.
 *
 * @param {ApiContext} context - Request context.
 * @param {() => Promise<Response>} next - Next middleware/handler.
 * @returns {Promise<Response>} Response.
 */
export async function authorizationInterceptor(context, next) {
  context.locals.auth = await authenticateAdmin(context.request);
  return next();
}
