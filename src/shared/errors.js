/**
 * Application error types and factories for layered error handling.
 * @module shared/errors
 */

/**
 * Base application error with HTTP/status metadata.
 */
export class AppError extends Error {
  /**
   * @param {object} options - Error options.
   * @param {number} [options.status=500] - HTTP status code.
   * @param {string} [options.code="internal_error"] - Stable machine-readable code.
   * @param {string} [options.message="An unexpected error occurred."] - Safe client-facing message.
   * @param {boolean} [options.expose=false] - Whether the message is safe to expose as-is.
   * @param {unknown} [options.cause] - Underlying cause.
   */
  constructor({
    status = 500,
    code = "internal_error",
    message = "An unexpected error occurred.",
    expose = false,
    cause
  } = {}) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.expose = expose || status < 500;
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

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

/**
 * Normalizes unknown thrown values into an AppError.
 *
 * @param {unknown} error - Thrown value.
 * @returns {AppError} Normalized application error.
 */
export function normalizeError(error) {
  if (error instanceof AppError) {
    return error;
  }

  return internalError("internal_error", "An unexpected error occurred.", error);
}
