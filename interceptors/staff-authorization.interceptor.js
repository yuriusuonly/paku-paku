import { authenticateStaff } from "../repositories/auth.repository.js";

/**
 * Staff authorization interceptor.
 * @module interceptors/staff-authorization.interceptor
 */

/**
 * @typedef {import("../network/middleware.js").ApiContext} ApiContext
 */

/**
 * Requires an authenticated staff profile and stores auth data in `context.locals.auth`.
 *
 * @param {ApiContext} context - Request context.
 * @param {() => Promise<Response>} next - Next middleware/handler.
 * @returns {Promise<Response>} Response.
 */
export async function staffAuthorizationInterceptor(context, next) {
  context.locals.auth = await authenticateStaff(context.request);
  return next();
}
