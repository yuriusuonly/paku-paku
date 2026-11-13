/**
 * Bad request error type.
 * @module shared/errors/bad-request
 */

export class BadRequestError extends Error {
  /**
   * @param {string} code - Error code.
   * @param {string} message - Client-facing message.
   * @param {unknown} [cause] - Underlying cause.
   */
  constructor(code, message, cause) {
    super(message);
    this.name = "BadRequestError";
    this.status = 400;
    this.code = code;
    this.expose = true;
    this.isAppError = true;
    if (cause !== undefined) this.cause = cause;
  }
}

/**
 * @param {string} code - Error code.
 * @param {string} message - Client-facing message.
 * @returns {BadRequestError}
 */
export function badRequest(code, message) {
  return new BadRequestError(code, message);
}
