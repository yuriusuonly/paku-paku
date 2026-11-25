/**
 * Bad gateway error type.
 * @module shared/errors/bad-gateway
 */

export class BadGatewayError extends Error {
  constructor(code, message, cause) {
    super(message);
    this.name = "BadGatewayError";
    this.status = 502;
    this.code = code;
    this.expose = true;
    this.isAppError = true;
    if (cause !== undefined) this.cause = cause;
  }
}

export function badGateway(code, message, cause) {
  return new BadGatewayError(code, message, cause);
}
