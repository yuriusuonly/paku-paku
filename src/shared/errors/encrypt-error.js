/**
 * Encryption error type.
 * @module shared/errors/encrypt-error
 */

export class EncryptError extends Error {
  constructor(message = "Could not encrypt data.", cause) {
    super(message);
    this.name = "EncryptError";
    this.status = 500;
    this.code = "encrypt_failed";
    this.expose = false;
    this.isAppError = true;
    if (cause !== undefined) this.cause = cause;
  }
}

export function encryptError(message = "Could not encrypt data.", cause) {
  return new EncryptError(message, cause);
}
