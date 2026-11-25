import { internalError } from "./internal.js";

/**
 * Error normalization utilities.
 * @module shared/errors/normalize
 */

/**
 * Normalizes unknown thrown values into an application error object.
 *
 * @param {unknown} error - Thrown value.
 * @returns {Error & {status: number, code: string, expose: boolean}} Normalized error.
 */
export function normalizeError(error) {
  if (error && typeof error === "object" && error.isAppError === true) {
    return error;
  }

  return internalError("internal_error", "An unexpected error occurred.", error);
}
