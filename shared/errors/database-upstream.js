/**
 * Database upstream error type.
 * @module shared/errors/database-upstream
 */

/**
 * Error thrown when a database upstream request or operation fails.
 */
export class DatabaseUpstreamError extends Error {
  /**
   * @param {string} code - Error code.
   * @param {string} message - Client-facing message.
   * @param {unknown} [cause] - Underlying cause.
   */
  constructor(code, message, cause) {
    super(message);
    this.name = "DatabaseUpstreamError";
    this.status = 502;
    this.code = code;
    this.expose = true;
    this.isAppError = true;
    if (cause !== undefined) this.cause = cause;
  }
}

/**
 * @param {string} code - Error code.
 * @param {string} message - Client-facing message.
 * @param {unknown} [cause] - Underlying cause.
 * @returns {DatabaseUpstreamError}
 */
export function databaseUpstream(code, message, cause) {
  return new DatabaseUpstreamError(code, message, cause);
}
