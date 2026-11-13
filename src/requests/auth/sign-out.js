/**
 * Request handling for `POST /api/auth/sign-out`.
 * @module requests/auth/sign-out
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
