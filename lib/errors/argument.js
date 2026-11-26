/**
 * CLI argument error type.
 * @module errors/argument
 */

/**
 * Error thrown when CLI arguments are invalid.
 */
export class ArgumentError extends Error {
  /**
   * @param {string} message - Error message.
   * @param {unknown} [cause] - Underlying failure.
   */
  constructor(message, cause) {
    super(message);
    this.name = "ArgumentError";
    this.status = 500;
    this.code = "argument_error";
    this.expose = false;
    this.isAppError = true;
    if (cause !== undefined) this.cause = cause;
  }
}

/**
 * @param {string} message - Error message.
 * @param {unknown} [cause] - Underlying failure.
 * @returns {ArgumentError}
 */
export function argumentError(message, cause) {
  return new ArgumentError(message, cause);
}
