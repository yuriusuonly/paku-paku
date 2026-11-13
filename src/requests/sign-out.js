/**
 * Request handling for `POST /api/sign-out`.
 * @module requests/sign-out
 */

/**
 * Validates the sign-out request (token presence is enforced by the repository/service logic).
 *
 * @param {Request} request - Incoming request.
 * @returns {Request} The same request.
 */
export function validateSignOutRequest(request) {
  return request;
}
