/**
 * Pure inventory rules used during transaction creation.
 * @module domain/transactions/inventory-rules
 */

/**
 * Whether an item should be treated as a beverage for supply deduction.
 *
 * @param {string} name - Item name.
 * @param {number} sortOrder - Menu sort order.
 * @returns {boolean}
 */
export function isBeverage(name, sortOrder) {
  return Number(sortOrder) < 150 || /tea|matcha|mugicha|sobacha/i.test(String(name || ""));
}

/**
 * Returns shared supply SKUs to decrement for a transaction line.
 *
 * @param {{name?: string, sortOrder?: number}} item - Item/menu context.
 * @returns {string[]} Supply SKUs.
 */
export function getSupplySkus({ name, sortOrder }) {
  const beverage = isBeverage(name, sortOrder);
  const cold = /iced|cold/i.test(String(name || ""));
  const primary = beverage ? (cold ? "SUP-CUP-COLD" : "SUP-CUP-HOT") : "SUP-CONTAINER";
  const extras = beverage ? ["SUP-LID"] : ["SUP-CHOPSTICKS"];
  return [primary, ...extras, "SUP-NAPKIN"];
}

/**
 * Whether any linked inventory row still has positive stock.
 *
 * @param {Array<{quantity?: number}>} rows
 * @returns {boolean}
 */
export function hasPositiveStock(rows) {
  return (rows || []).some((row) => Number(row.quantity || 0) > 0);
}

/**
 * Whether inventory should be adjusted for a transaction status.
 *
 * @param {unknown} status
 * @returns {boolean}
 */
export function shouldAdjustInventory(status) {
  return status !== "cancelled";
}
