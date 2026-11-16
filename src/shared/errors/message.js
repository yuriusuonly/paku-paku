/**
 * User-facing error message helpers.
 * @module shared/errors/message
 */

/**
 * Returns a safe, human-readable message from an unknown thrown value.
 *
 * @param {unknown} error - Thrown value.
 * @param {string} fallback - Message used when no usable message exists.
 * @returns {string} Message safe for display.
 */
export function getErrorMessage(error, fallback) {
  return error && typeof error.message === "string" && error.message.trim()
    ? error.message
    : fallback;
}
