import { jsonResponse } from "../network/response.js";
import { HTTP_STATUS } from "../network/http.js";

/**
 * Response shaping for `POST /api/auth/register`.
 * @module responses/auth-register
 */

/**
 * Builds the registration response.
 *
 * @param {{user: object, session?: object | null}} data - Registration payload.
 * @returns {Response} JSON response.
 */
export function registerResponse(data) {
  return jsonResponse(data, { status: HTTP_STATUS.CREATED });
}
