/**
 * Request handling for `GET /api/auth/session`.
 * @module requests/auth-session
 */

/**
 * Validates the session request (authentication is enforced by interceptors).
 *
 * @param {Request} request - Incoming request.
 * @returns {Request} The same request.
 */
export function validateSessionRequest(request) {
  return request;
}
