/**
 * Service unavailable error type.
 * @module shared/errors/service-unavailable
 */

export class ServiceUnavailableError extends Error {
  constructor(code, message, cause) {
    super(message);
    this.name = "ServiceUnavailableError";
    this.status = 503;
    this.code = code;
    this.expose = true;
    this.isAppError = true;
    if (cause !== undefined) this.cause = cause;
  }
}

export function serviceUnavailable(code, message, cause) {
  return new ServiceUnavailableError(code, message, cause);
}
