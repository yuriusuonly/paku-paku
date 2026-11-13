import { badRequest } from "../errors/bad-request.js";
import { readJsonBody } from "../network/request.js";

/**
 * Request handling/validation for `POST /api/auth/sign-in`.
 * @module requests/auth-sign-in
 */

/**
 * @type {RegExp}
 */
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_.-]{2,31}$/;

/**
 * @type {string}
 */
const LOGIN_EMAIL_DOMAIN = "paku-paku.local";

/**
 * Normalizes a username.
 *
 * @param {unknown} value - Raw username.
 * @returns {string} Normalized username.
 */
export function normalizeUsername(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/**
 * Derives internal auth email for a username.
 *
 * @param {string} username - Normalized username.
 * @returns {string} Auth email.
 */
export function loginEmailForUsername(username) {
  return `${username}@${LOGIN_EMAIL_DOMAIN}`;
}

/**
 * Parses and validates a sign-in request.
 *
 * @param {Request} request - Incoming request.
 * @returns {Promise<{username: string, password: string, email: string}>} Validated credentials.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} On invalid request.
 */
export async function parseSignInRequest(request) {
  const body = await readJsonBody(request);

  if (!body) {
    throw badRequest("invalid_body", "Expected a JSON object with username and password.");
  }

  const username = normalizeUsername(body.username);
  const password = typeof body.password === "string" ? body.password : "";

  if (!USERNAME_PATTERN.test(username) || password.length === 0) {
    throw badRequest("invalid_credentials", "Enter a valid username and password.");
  }

  return {
    username,
    password,
    email: loginEmailForUsername(username)
  };
}
