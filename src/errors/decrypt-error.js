/**
 * Decryption error type.
 * @module errors/decrypt-error
 */

export class DecryptError extends Error {
  constructor(message = "Could not decrypt data.", cause) {
    super(message);
    this.name = "DecryptError";
    this.status = 500;
    this.code = "decrypt_failed";
    this.expose = false;
    this.isAppError = true;
    if (cause !== undefined) this.cause = cause;
  }
}

export function decryptError(message = "Could not decrypt data.", cause) {
  return new DecryptError(message, cause);
}
