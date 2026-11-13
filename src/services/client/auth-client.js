import { apiRequest } from "./http.js";

/**
 * Client-side authentication API calls.
 * @module services/auth-client
 */

/**
 * Signs in with username and password.
 *
 * @param {{username: string, password: string}} credentials - Sign-in credentials.
 * @returns {Promise<{user: object, session: {access_token: string, refresh_token: string, expires_at?: number, expires_in?: number, token_type?: string}}>} Session payload.
 */
export function signIn(credentials) {
  return apiRequest("/api/auth/sign-in", {
    method: "POST",
    body: credentials
  });
}

/**
 * Loads the current session profile for an access token.
 *
 * @param {string} token - Access token.
 * @returns {Promise<{user: object}>} Session payload.
 */
export function getSession(token) {
  return apiRequest("/api/auth/session", {
    token
  });
}

/**
 * Signs out the current session.
 *
 * @param {string} token - Access token.
 * @returns {Promise<null>} Resolves when the session is revoked.
 */
export function signOut(token) {
  return apiRequest("/api/auth/sign-out", {
    method: "POST",
    token
  });
}
