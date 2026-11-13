import { jsonResponse } from "../shared/response.js";

/**
 * Response shaping for `GET /api/admin/profiles`.
 * @module responses/admin-profiles
 */

/**
 * Builds the admin profiles response.
 *
 * @param {{profiles: object[]}} data - Profiles payload.
 * @returns {Response} JSON response.
 */
export function adminProfilesResponse(data) {
  return jsonResponse(data);
}
