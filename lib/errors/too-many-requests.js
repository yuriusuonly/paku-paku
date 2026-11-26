/**
 * Too many requests error type.
 * @module errors/too-many-requests
 */

export class TooManyRequestsError extends Error {
  constructor(code, message, cause) {
    super(message);
    this.name = "TooManyRequestsError";
    this.status = 429;
    this.code = code;
    this.expose = true;
    this.isAppError = true;
    if (cause !== undefined) this.cause = cause;
  }
}

export function tooManyRequests(code, message) {
  return new TooManyRequestsError(code, message);
}
