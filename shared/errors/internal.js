/**
 * Internal server error type.
 * @module shared/errors/internal
 */

export class InternalError extends Error {
  constructor(code = "internal_error", message = "An unexpected error occurred.", cause) {
    super(message);
    this.name = "InternalError";
    this.status = 500;
    this.code = code;
    this.expose = false;
    this.isAppError = true;
    if (cause !== undefined) this.cause = cause;
  }
}

export function internalError(code = "internal_error", message = "An unexpected error occurred.", cause) {
  return new InternalError(code, message, cause);
}
