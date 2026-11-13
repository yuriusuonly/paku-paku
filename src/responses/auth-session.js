import { jsonResponse } from "../shared/response.js";

/**
 * Response shaping for `GET /api/auth/session`.
 * @module responses/auth-session
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
