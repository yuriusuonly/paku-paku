import { api } from "../constants/config.js";
import { apiRequest } from "../network/transport.js";

/**
 * Client-to-API administrator authentication contracts.
 * @module services/auth
 */

/**
 * Signs in with email and password.
 *
 * @param {{email: string, password: string}} credentials - Sign-in credentials.
 * @returns {Promise<{user: object, session: object}>} Session payload.
 */
export function signIn(credentials) {
  return apiRequest(api.endpoints.signin, {
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
  return apiRequest(api.endpoints.session, { token });
}

/**
 * Signs out the current session.
 *
 * @param {string} token - Access token.
 * @returns {Promise<null>} Resolves when the session is revoked.
 */
export function signOut(token) {
  return apiRequest(api.endpoints.signout, {
    method: "POST",
    token
  });
}
