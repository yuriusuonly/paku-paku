/**
 * Database unconfigured error type.
 * @module errors/database-unconfigured
 */

/**
 * Error thrown when the database is not configured for the selected environment.
 */
export class DatabaseUnconfiguredError extends Error {
  /**
   * @param {string} [message] - Client-facing message.
   * @param {unknown} [cause] - Underlying cause.
   */
  constructor(message = "Database is not configured.", cause) {
    super(message);
    this.name = "DatabaseUnconfiguredError";
    this.status = 503;
    this.code = "database_unconfigured";
    this.expose = true;
    this.isAppError = true;
    if (cause !== undefined) this.cause = cause;
  }
}

/**
 * @param {string} [message] - Client-facing message.
 * @param {unknown} [cause] - Underlying cause.
 * @returns {DatabaseUnconfiguredError}
 */
export function databaseUnconfigured(message = "Database is not configured.", cause) {
  return new DatabaseUnconfiguredError(message, cause);
}
