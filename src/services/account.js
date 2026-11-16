import { api } from "../shared/constants/config.js";
import { apiRequest } from "../shared/network/transport.js";

/**
 * Client-to-API account contracts.
 * @module services/account
 */

/**
 * Loads the current account profile.
 *
 * @param {string} token - Access token.
 * @returns {Promise<{profile: object}>} Account profile payload.
 */
export function getMyAccount(token) {
  return apiRequest(api.endpoints.accountProfile, { token });
}

/**
 * Changes the current account password.
 *
 * @param {string} token - Access token.
 * @param {string} password - New password.
 * @returns {Promise<{profile: object}>} Updated account payload.
 */
export function changeMyPassword(token, password) {
  return apiRequest(api.endpoints.accountProfile, {
    method: "PATCH",
    token,
    body: { password }
  });
}
