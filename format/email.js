/**
 * Email formatting helpers.
 * @module format/email
 */

/**
 * Normalizes an email-like identifier to lowercase trimmed form.
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}
