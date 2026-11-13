import { api } from "../shared/constants/config.js";
import { apiRequest } from "../shared/network/transport.js";

/**
 * Client-to-API authentication contracts.
 * @module services/auth
 */

/**
 * Signs in with username and password.
 *
 * @param {{username: string, password: string}} credentials - Sign-in credentials.
 * @returns {Promise<{user: object, session: {access_token: string, refresh_token: string, expires_at?: number, expires_in?: number, token_type?: string}}>} Session payload.
 */
export function signIn(credentials) {
  return apiRequest(api.endpoints.signIn, {
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
  return apiRequest(api.endpoints.session, {
    token
  });
}

/**
 * Signs up a new customer account.
 *
 * @param {{username: string, password: string}} credentials - Sign-up credentials.
 * @returns {Promise<{user: object, session?: object | null}>} Sign-up payload.
 */
export function signUp(credentials) {
  return apiRequest(api.endpoints.signUp, {
    method: "POST",
    body: credentials
  });
}

/**
 * Signs out the current session.
 *
 * @param {string} token - Access token.
 * @returns {Promise<null>} Resolves when the session is revoked.
 */
export function signOut(token) {
  return apiRequest(api.endpoints.signOut, {
    method: "POST",
    token
  });
}
