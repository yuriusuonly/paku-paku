import { z } from "zod";
import { badRequest } from "../errors/bad-request.js";

/**
 * Password validation helpers backed by Zod.
 * @module validation/password
 */

/**
 * Minimum accepted password length.
 * @type {number}
 */
export const MIN_PASSWORD_LENGTH = 6;

/**
 * Password schema.
 * @type {import("zod").ZodString}
 */
export const passwordSchema = z.string().min(MIN_PASSWORD_LENGTH);

/**
 * Checks whether a password meets the minimum length rule.
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidPassword(value) {
  return passwordSchema.safeParse(value).success;
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
  const result = passwordSchema.safeParse(value);
  if (!result.success) {
    throw badRequest(code, message);
  }
  return result.data;
}
