import { z } from "zod";
import { parseWithSchema } from "./request.js";

/**
 * Email validation helpers backed by Zod.
 * @module validation/email
 */

/**
 * Email schema: trims, lowercases, and validates basic email shape.
 * @type {import("zod").ZodType<string>}
 */
export const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

/**
 * Checks whether a value is a valid, normalized email.
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidEmail(value) {
  return emailSchema.safeParse(value).success;
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
  return parseWithSchema(emailSchema, value, { code, message });
}
