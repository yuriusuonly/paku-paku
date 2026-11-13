import { errorResponse } from "../responses/index.js";
import { normalizeError } from "../shared/errors.js";

/**
 * Error handling interceptor.
 * @module interceptors/error-interceptor
 */

/**
 * @typedef {import("./context.js").ApiContext} ApiContext
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

    if (appError.status >= 500) {
      console.error("[api] unhandled error", {
        code: appError.code,
        status: appError.status,
        message: appError.message,
        cause: appError.cause
      });
    }

    const message =
      appError.expose || appError.status < 500
        ? appError.message
        : "An unexpected error occurred.";

    return errorResponse(appError.status, appError.code, message);
  }
}
