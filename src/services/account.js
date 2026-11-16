import { api } from "../shared/constants/config.js";
import { apiRequest } from "../shared/network/transport.js";

/**
 * Client-to-API account contracts.
 * @module services/account
 */

/** @param {string} token */
export function getMyAccount(token) { return apiRequest(api.endpoints.accountProfile, { token }); }
/** @param {string} token @param {string} password */
export function changeMyPassword(token, password) {
  return apiRequest(api.endpoints.accountProfile, { method: "PATCH", token, body: { password } });
}
