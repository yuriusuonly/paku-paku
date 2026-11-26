import { authenticateCustomer } from "../repositories/auth.repository.js";

/**
 * Customer authorization interceptor.
 * @module interceptors/customer-authorization.interceptor
 */

/**
 * @typedef {import("../network/middleware.js").ApiContext} ApiContext
 */

/**
 * Requires an authenticated customer profile and stores auth data in `context.locals.auth`.
 *
 * @param {ApiContext} context - Request context.
 * @param {() => Promise<Response>} next - Next middleware/handler.
 * @returns {Promise<Response>} Response.
 */
export async function customerAuthorizationInterceptor(context, next) {
  context.locals.auth = await authenticateCustomer(context.request);
  return next();
}
