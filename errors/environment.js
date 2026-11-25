/**
 * Environment configuration error type.
 * @module errors/environment
 */

/**
 * Error thrown when environment configuration cannot be read.
 */
export class EnvironmentError extends Error {
  /**
   * @param {string} message - Error message.
   * @param {unknown} [cause] - Underlying failure.
   */
  constructor(message, cause) {
    super(message);
    this.name = "EnvironmentError";
    this.status = 500;
    this.code = "environment_error";
    this.expose = false;
    this.isAppError = true;
    if (cause !== undefined) this.cause = cause;
  }
}

/**
 * @param {string} message - Error message.
 * @param {unknown} [cause] - Underlying failure.
 * @returns {EnvironmentError}
 */
export function environmentError(message, cause) {
  return new EnvironmentError(message, cause);
}
