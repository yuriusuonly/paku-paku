/**
 * Forbidden error type.
 * @module shared/errors/forbidden
 */

export class ForbiddenError extends Error {
  constructor(code, message, cause) {
    super(message);
    this.name = "ForbiddenError";
    this.status = 403;
    this.code = code;
    this.expose = true;
    this.isAppError = true;
    if (cause !== undefined) this.cause = cause;
  }
}

export function forbidden(code, message) {
  return new ForbiddenError(code, message);
}
