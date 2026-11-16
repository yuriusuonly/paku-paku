/**
 * Inventory status rules and labels.
 * @module domain/inventory/status
 */

/**
 * Inventory status labels.
 * @type {{active: string, inactive: string}}
 */
export const INVENTORY_STATUS = {
  active: "In Stock",
  inactive: "Out of Stock"
};

/**
 * Returns the display label for an inventory item.
 *
 * @param {unknown} isActive
 * @returns {string}
 */
export function getInventoryStatusLabel(isActive) {
  return isActive ? INVENTORY_STATUS.active : INVENTORY_STATUS.inactive;
}

/**
 * Whether an inventory item is considered in stock.
 *
 * @param {{is_active?: unknown}} item
 * @returns {boolean}
 */
export function isInStock(item) {
  return Boolean(item?.is_active);
}
