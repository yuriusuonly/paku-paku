import { jsonResponse } from "../network/response.js";

/**
 * Response shaping for `POST /api/sign-in`.
 * @module responses/sign-in
 */

/**
 * Builds the sign-in response.
 *
 * @param {{user: object, session: object}} data - Session payload.
 * @returns {Response} JSON response.
 */
export function signInResponse(data) {
  return jsonResponse(data);
}
