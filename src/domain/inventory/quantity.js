/**
 * Inventory quantity rules.
 * @module domain/inventory/quantity
 */

/**
 * Applies a quantity delta, clamped to zero.
 *
 * @param {number} currentQuantity
 * @param {number} delta
 * @returns {number}
 */
export function calculateAdjustedQuantity(currentQuantity, delta) {
  return Math.max(0, Number(currentQuantity || 0) + Number(delta || 0));
}
