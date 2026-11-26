/**
 * Console error type.
 * @module errors/console
 */

/**
 * Error thrown when a built-in console operation fails.
 */
export class ConsoleError extends Error {
  /**
   * @param {string} message - Error message.
   * @param {unknown} [cause] - Underlying failure.
   */
  constructor(message, cause) {
    super(message);
    this.name = "ConsoleError";
    this.status = 500;
    this.code = "console_error";
    this.expose = false;
    this.isAppError = true;
    if (cause !== undefined) this.cause = cause;
  }
}

/**
 * @param {string} message - Error message.
 * @param {unknown} [cause] - Underlying failure.
 * @returns {ConsoleError}
 */
export function consoleError(message, cause) {
  return new ConsoleError(message, cause);
}
