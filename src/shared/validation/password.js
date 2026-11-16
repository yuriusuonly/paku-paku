import { badRequest } from "../errors/bad-request.js";

/**
 * Password validation helpers.
 * @module shared/validation/password
 */

/**
 * Minimum accepted password length.
 * @type {number}
 */
export const MIN_PASSWORD_LENGTH = 6;

/**
 * Checks whether a password meets the minimum length rule.
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidPassword(value) {
  return typeof value === "string" && value.length >= MIN_PASSWORD_LENGTH;
}

/**
 * Requires a valid password.
 *
 * @param {unknown} value
 * @param {{code?: string, message?: string}} [options]
 * @returns {string}
 */
export function requirePassword(value, {
  code = "invalid_password",
  message = "Password must be at least 6 characters."
} = {}) {
  if (!isValidPassword(value)) {
    throw badRequest(code, message);
  }
  return value;
}
