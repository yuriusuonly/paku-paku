/**
 * Staff role rules and route mapping.
 * @module domain/auth/roles
 */

/**
 * Supported staff roles.
 * @type {{admin: string, staff: string}}
 */
export const ROLES = Object.freeze({
  admin: "admin",
  staff: "staff"
});

/**
 * @param {unknown} role
 * @returns {boolean}
 */
export function isAdminRole(role) {
  return role === ROLES.admin;
}

/**
 * @param {unknown} role
 * @returns {boolean}
 */
export function isStaffRole(role) {
  return role === ROLES.staff;
}

/**
 * Whether a role may access the staff counter area.
 *
 * @param {unknown} role
 * @returns {boolean}
 */
export function hasStaffAccess(role) {
  return isAdminRole(role) || isStaffRole(role);
}

/**
 * Returns the landing route for a signed-in role.
 *
 * @param {unknown} role
 * @returns {string}
 */
export function getHomeRouteForRole(role) {
  if (isAdminRole(role)) return "/admin";
  if (isStaffRole(role)) return "/staff";
  return "/menu";
}
