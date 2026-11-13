import { badRequest } from "../errors/bad-request.js";
import { readJsonBody } from "../network/request.js";

/**
 * Request handling/validation for `POST /api/auth/signup`.
 * @module requests/auth-signup
 */

export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_.-]{2,31}$/;
const LOGIN_EMAIL_DOMAIN = "paku-paku.local";

/**
 * @param {unknown} value - Raw username.
 * @returns {string} Normalized username.
 */
export function normalizeUsername(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/**
 * @param {string} username - Normalized username.
 * @returns {string} Internal auth email.
 */
export function loginEmailForUsername(username) {
  return `${username}@${LOGIN_EMAIL_DOMAIN}`;
}

/**
 * Parses and validates a sign-up request.
 *
 * @param {Request} request - Incoming request.
 * @returns {Promise<{username: string, password: string, email: string}>} Validated payload.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} On invalid request.
 */
export async function parseSignUpRequest(request) {
  const body = await readJsonBody(request);

  if (!body) {
    throw badRequest("invalid_body", "Expected a JSON object with username and password.");
  }

  const username = normalizeUsername(body.username);
  const password = typeof body.password === "string" ? body.password : "";

  if (!USERNAME_PATTERN.test(username)) {
    throw badRequest("invalid_username", "Choose a valid username (3-32 chars, lowercase letters, numbers, ., _, -).");
  }

  if (password.length < 6) {
    throw badRequest("invalid_password", "Password must be at least 6 characters.");
  }

  return {
    username,
    password,
    email: loginEmailForUsername(username)
  };
}
