import { jsonResponse } from "../network/response.js";
import { HTTP_STATUS } from "../network/status.js";

/**
 * Response shaping for `POST /api/sign-up`.
 * @module responses/sign-up
 */

/**
 * Builds the sign-up response.
 *
 * @param {{user: object, session?: object | null}} data - Sign-up payload.
 * @returns {Response} JSON response.
 */
export function signUpResponse(data) {
  return jsonResponse(data, { status: HTTP_STATUS.CREATED });
}
