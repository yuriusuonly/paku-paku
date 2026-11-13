/**
 * Request handling for `GET /api/admin/profiles`.
 * @module requests/admin-profiles
 */

/**
 * Validates the admin profiles request (authorization is enforced by interceptors).
 *
 * @param {Request} request - Incoming request.
 * @returns {Request} The same request.
 */
export function validateAdminProfilesRequest(request) {
  return request;
}
