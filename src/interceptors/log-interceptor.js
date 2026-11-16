/**
 * Request/response logging interceptor.
 * @module interceptors/log-interceptor
 */

/**
 * @typedef {import("../shared/network/middleware.js").ApiContext} ApiContext
 */

/**
 * Logs API request completion with method, path, status, and duration.
 *
 * @param {ApiContext} context - Request context.
 * @param {() => Promise<Response>} next - Next middleware/handler.
 * @returns {Promise<Response>} Response.
 */
export async function logInterceptor(context, next) {
  const response = await next();
  const duration = Date.now() - context.startedAt;
  console.info(`[api] ${context.method} ${context.url.pathname} ${response.status} ${duration}ms`);
  return response;
}
