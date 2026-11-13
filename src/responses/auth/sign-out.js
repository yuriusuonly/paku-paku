import { noContent } from "../../shared/response.js";

/**
 * Response shaping for `POST /api/auth/sign-out`.
 * @module responses/auth/sign-out
 */

/**
 * Builds the sign-out response.
 *
 * @returns {Response} 204 No Content response.
 */
export function signOutResponse() {
  return noContent();
}
