import { api } from "../shared/constants/config.js";
import { apiRequest } from "../shared/network/transport.js";

/**
 * Client-to-API account/profile contracts.
 * @module services/account
 */

/** @param {string} token */
export function getMyProfile(token) { return apiRequest(api.endpoints.accountProfile, { token }); }
/** @param {string} token @param {object} input */
export function updateMyProfile(token, input) { return apiRequest(api.endpoints.accountProfile, { method: "PATCH", token, body: input }); }
