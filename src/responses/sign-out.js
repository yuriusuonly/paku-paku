import { noContent } from "../network/response.js";

/**
 * Response shaping for `POST /api/sign-out`.
 * @module responses/sign-out
 */

/**
 * Builds the sign-out response.
 *
 * @returns {Response} 204 No Content response.
 */
export function signOutResponse() {
  return noContent();
}
