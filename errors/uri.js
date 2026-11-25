/**
 * URI operation error type.
 * @module errors/uri
 */

/**
 * Error thrown when a URI operation fails.
 */
export class UriError extends Error {
  /**
   * @param {string} message - Error message.
   * @param {unknown} [cause] - Underlying failure.
   */
  constructor(message, cause) {
    super(message);
    this.name = "UriError";
    this.status = 500;
    this.code = "uri_error";
    this.expose = false;
    this.isAppError = true;
    if (cause !== undefined) this.cause = cause;
  }
}

/**
 * @param {string} message - Error message.
 * @param {unknown} [cause] - Underlying failure.
 * @returns {UriError}
 */
export function uriError(message, cause) {
  return new UriError(message, cause);
}
