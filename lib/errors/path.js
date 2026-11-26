/**
 * Filesystem path error type.
 * @module errors/path
 */

/**
 * Error thrown when a filesystem path operation fails.
 */
export class PathError extends Error {
  /**
   * @param {string} message - Error message.
   * @param {unknown} [cause] - Underlying failure.
   */
  constructor(message, cause) {
    super(message);
    this.name = "PathError";
    this.status = 500;
    this.code = "path_error";
    this.expose = false;
    this.isAppError = true;
    if (cause !== undefined) this.cause = cause;
  }
}

/**
 * @param {string} message - Error message.
 * @param {unknown} [cause] - Underlying failure.
 * @returns {PathError}
 */
export function pathError(message, cause) {
  return new PathError(message, cause);
}
