import { api } from "../shared/constants/config.js";
import { apiRequest } from "../shared/network/transport.js";

/**
 * Client-to-API admin contracts.
 * @module services/admin
 */

/**
 * Loads all profiles for an administrator.
 *
 * @param {string} token - Access token for an admin session.
 * @returns {Promise<{profiles: object[]}>} Profiles payload.
 */
export function getProfiles(token) {
  return apiRequest(api.endpoints.adminProfiles, {
    token
  });
}

/**
 * Creates a customer user/profile as an administrator.
 *
 * @param {string} token - Access token for an admin session.
 * @param {{username: string, password: string}} input - User payload.
 * @returns {Promise<{profile: object}>} Created profile payload.
 */
export function createProfileUser(token, input) {
  return apiRequest(api.endpoints.adminProfiles, {
    method: "POST",
    token,
    body: input
  });
}

/**
 * Updates a profile's management fields as an administrator.
 *
 * @param {string} token - Access token for an admin session.
 * @param {{id: string, is_active?: boolean}} input - Profile update payload.
 * @returns {Promise<{profile: object}>} Updated profile payload.
 */
export function updateProfile(token, input) {
  return apiRequest(api.endpoints.adminProfiles, {
    method: "PATCH",
    token,
    body: input
  });
}
