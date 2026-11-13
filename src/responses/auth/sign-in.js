import { jsonResponse } from "../../shared/response.js";

/**
 * Response shaping for `POST /api/auth/sign-in`.
 * @module responses/auth/sign-in
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
