import { badRequest } from "../errors/bad-request.js";
import { normalizeEmail } from "../format/email.js";

/**
 * Email validation helpers.
 * @module shared/validation/email
 */

/**
 * Basic email shape used for request validation.
 * @type {RegExp}
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Checks whether a value is a valid, normalized email.
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidEmail(value) {
  return EMAIL_PATTERN.test(normalizeEmail(value));
}

/**
 * Requires a valid email and returns its normalized form.
 *
 * @param {unknown} value
 * @param {{code?: string, message?: string}} [options]
 * @returns {string}
 */
export function requireEmail(value, {
  code = "invalid_email",
  message = "Enter a valid email address."
} = {}) {
  const email = normalizeEmail(value);
  if (!EMAIL_PATTERN.test(email)) {
    throw badRequest(code, message);
  }
  return email;
}
