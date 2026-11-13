import { jsonResponse } from "../network/response.js";

/**
 * Response shaping for `GET /api/session`.
 * @module responses/session
 */

/**
 * Builds the session response.
 *
 * @param {{user: object}} data - Session payload.
 * @returns {Response} JSON response.
 */
export function sessionResponse(data) {
  return jsonResponse(data);
}
