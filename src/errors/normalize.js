import { AppError } from "./app-error.js";
import { internalError } from "./http.js";

/**
 * Error normalization utilities.
 * @module errors/normalize
 */

/**
 * Normalizes unknown thrown values into an AppError.
 *
 * @param {unknown} error - Thrown value.
 * @returns {AppError} Normalized application error.
 */
export function normalizeError(error) {
  if (error instanceof AppError) {
    return error;
  }

  return internalError("internal_error", "An unexpected error occurred.", error);
}
