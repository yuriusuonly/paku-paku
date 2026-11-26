/**
 * Process error type.
 * @module errors/process
 */

/**
 * Error thrown when a process operation fails.
 */
export class ProcessError extends Error {
  /**
   * @param {string} message - Error message.
   * @param {unknown} [cause] - Underlying failure.
   */
  constructor(message, cause) {
    super(message);
    this.name = "ProcessError";
    this.status = 500;
    this.code = "process_error";
    this.expose = false;
    this.isAppError = true;
    if (cause !== undefined) this.cause = cause;
  }
}

/**
 * @param {string} message - Error message.
 * @param {unknown} [cause] - Underlying failure.
 * @returns {ProcessError}
 */
export function processError(message, cause) {
  return new ProcessError(message, cause);
}
