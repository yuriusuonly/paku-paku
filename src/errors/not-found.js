/**
 * Not found error type.
 * @module errors/not-found
 */

export class NotFoundError extends Error {
  constructor(code, message, cause) {
    super(message);
    this.name = "NotFoundError";
    this.status = 404;
    this.code = code;
    this.expose = true;
    this.isAppError = true;
    if (cause !== undefined) this.cause = cause;
  }
}

export function notFound(code, message) {
  return new NotFoundError(code, message);
}
