import { errorResponse } from "../network/response.js";
import { normalizeError } from "../errors/normalize.js";

/**
 * Error handling interceptor.
 * @module interceptors/error.interceptor
 */

/**
 * @typedef {import("../network/middleware.js").ApiContext} ApiContext
 */

/**
 * Catches errors and maps them to standardized HTTP error responses.
 *
 * @param {ApiContext} context - Request context.
 * @param {() => Promise<Response>} next - Next middleware/handler.
 * @returns {Promise<Response>} Response.
 */
export async function errorInterceptor(context, next) {
  try {
    return await next();
  } catch (error) {
    const appError = normalizeError(error);

    const logPayload = {
      status: appError.status,
      code: appError.code,
      reason: appError.message
    };

    if (appError.status >= 500) {
      console.error(`[api] ${context.method} ${context.url.pathname} ${appError.status} ${appError.code}`, logPayload);
    } else {
      console.warn(`[api] ${context.method} ${context.url.pathname} ${appError.status} ${appError.code}`, logPayload);
    }

    const message =
      appError.expose || appError.status < 500
        ? appError.message
        : "An unexpected error occurred.";

    return errorResponse(appError.status, appError.code, message);
  }
}
