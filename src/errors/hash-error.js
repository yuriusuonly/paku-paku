/**
 * Hashing error type.
 * @module errors/hash-error
 */

export class HashError extends Error {
  constructor(message = "Could not hash data.", cause) {
    super(message);
    this.name = "HashError";
    this.status = 500;
    this.code = "hash_failed";
    this.expose = false;
    this.isAppError = true;
    if (cause !== undefined) this.cause = cause;
  }
}

export function hashError(message = "Could not hash data.", cause) {
  return new HashError(message, cause);
}
