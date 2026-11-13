import { AppError } from "./app-error.js";

/**
 * HTTP/application error factory helpers.
 * @module errors/http
 */

/**
 * Creates a 400 Bad Request error.
 *
 * @param {string} code - Error code.
 * @param {string} message - Client-facing message.
 * @returns {AppError} App error.
 */
export function badRequest(code, message) {
  return new AppError({ status: 400, code, message, expose: true });
}

/**
 * Creates a 401 Unauthorized error.
 *
 * @param {string} code - Error code.
 * @param {string} message - Client-facing message.
 * @returns {AppError} App error.
 */
export function unauthorized(code, message) {
  return new AppError({ status: 401, code, message, expose: true });
}

/**
 * Creates a 403 Forbidden error.
 *
 * @param {string} code - Error code.
 * @param {string} message - Client-facing message.
 * @returns {AppError} App error.
 */
export function forbidden(code, message) {
  return new AppError({ status: 403, code, message, expose: true });
}

/**
 * Creates a 404 Not Found error.
 *
 * @param {string} code - Error code.
 * @param {string} message - Client-facing message.
 * @returns {AppError} App error.
 */
export function notFound(code, message) {
  return new AppError({ status: 404, code, message, expose: true });
}

/**
 * Creates a 429 Too Many Requests error.
 *
 * @param {string} code - Error code.
 * @param {string} message - Client-facing message.
 * @returns {AppError} App error.
 */
export function tooManyRequests(code, message) {
  return new AppError({ status: 429, code, message, expose: true });
}

/**
 * Creates a 502 Bad Gateway error for upstream failures.
 *
 * @param {string} code - Error code.
 * @param {string} message - Client-facing message.
 * @param {unknown} [cause] - Underlying cause.
 * @returns {AppError} App error.
 */
export function badGateway(code, message, cause) {
  return new AppError({ status: 502, code, message, expose: true, cause });
}

/**
 * Creates a 503 Service Unavailable error.
 *
 * @param {string} code - Error code.
 * @param {string} message - Client-facing message.
 * @param {unknown} [cause] - Underlying cause.
 * @returns {AppError} App error.
 */
export function serviceUnavailable(code, message, cause) {
  return new AppError({ status: 503, code, message, expose: true, cause });
}

/**
 * Creates a 500 Internal Server Error.
 *
 * @param {string} [code="internal_error"] - Error code.
 * @param {string} [message="An unexpected error occurred."] - Client-facing message.
 * @param {unknown} [cause] - Underlying cause.
 * @returns {AppError} App error.
 */
export function internalError(code = "internal_error", message = "An unexpected error occurred.", cause) {
  return new AppError({ status: 500, code, message, expose: false, cause });
}
