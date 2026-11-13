/**
 * Base application error type.
 * @module errors/app-error
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
