/**
 * Generic crypto/cipher error type.
 * @module errors/crypto-error
 */

export class CryptoError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {unknown} [cause]
   */
  constructor(code, message, cause) {
    super(message);
    this.name = "CryptoError";
    this.status = 500;
    this.code = code;
    this.expose = false;
    this.isAppError = true;
    if (cause !== undefined) this.cause = cause;
  }
}

export function cryptoError(code, message, cause) {
  return new CryptoError(code, message, cause);
}
