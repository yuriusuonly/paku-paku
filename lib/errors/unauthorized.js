/**
 * Unauthorized error type.
 * @module errors/unauthorized
 */

export class UnauthorizedError extends Error {
  /**
   * @param {string} code - Error code.
   * @param {string} message - Client-facing message.
   * @param {unknown} [cause] - Underlying cause.
   */
  constructor(code, message, cause) {
    super(message);
    this.name = "UnauthorizedError";
    this.status = 401;
    this.code = code;
    this.expose = true;
    this.isAppError = true;
    if (cause !== undefined) this.cause = cause;
  }
}

export function unauthorized(code, message) {
  return new UnauthorizedError(code, message);
}
