/**
 * File I/O error type.
 * @module errors/io
 */

/**
 * Error thrown when a file operation fails.
 */
export class IoError extends Error {
  /**
   * @param {string} message - Error message.
   * @param {unknown} [cause] - Underlying failure.
   */
  constructor(message, cause) {
    super(message);
    this.name = "IoError";
    this.status = 500;
    this.code = "io_error";
    this.expose = false;
    this.isAppError = true;
    if (cause !== undefined) this.cause = cause;
  }
}

/**
 * @param {string} message - Error message.
 * @param {unknown} [cause] - Underlying failure.
 * @returns {IoError}
 */
export function ioError(message, cause) {
  return new IoError(message, cause);
}
