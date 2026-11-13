import { badRequest } from "../shared/errors.js";

/**
 * Authentication request parsing and validation.
 * @module requests/auth-request
 */

/**
 * Allowed username shape.
 *
 * @type {RegExp}
 */
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_.-]{2,31}$/;

/**
 * Internal email domain for username-based accounts.
 *
 * @type {string}
 */
export const LOGIN_EMAIL_DOMAIN = "paku-paku.local";

/**
 * Normalizes a username for lookup and validation.
 *
 * @param {unknown} value - Raw username input.
 * @returns {string} Normalized username.
 */
export function normalizeUsername(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/**
 * Derives the internal Supabase Auth email for a username.
 *
 * @param {string} username - Normalized username.
 * @returns {string} Internal Auth email.
 */
export function loginEmailForUsername(username) {
  return `${username}@${LOGIN_EMAIL_DOMAIN}`;
}

/**
 * Validates and normalizes sign-in credentials from a request body.
 *
 * @param {Record<string, unknown> | null | undefined} body - Request body.
 * @returns {{username: string, password: string, email: string}} Normalized credentials.
 * @throws {import("../shared/errors.js").AppError} When credentials are invalid.
 */
export function parseSignInCredentials(body) {
  const username = normalizeUsername(body?.username);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!USERNAME_PATTERN.test(username) || password.length === 0) {
    throw badRequest("invalid_credentials", "Enter a valid username and password.");
  }

  return {
    username,
    password,
    email: loginEmailForUsername(username)
  };
}
