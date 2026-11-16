/**
 * Shared business domain values and labels.
 * @module shared/constants/domain
 */

/**
 * Supported transaction directions.
 * @type {string[]}
 */
export const TRANSACTION_KINDS = ["buy", "sell"];

/**
 * Supported transaction lifecycle states.
 * @type {string[]}
 */
export const TRANSACTION_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
  "cancelled"
];

/**
 * Supported payment states.
 * @type {string[]}
 */
export const PAYMENT_STATUSES = ["unpaid", "paid", "partial", "refunded"];

/**
 * Inventory status labels.
 * @type {{active: string, inactive: string}}
 */
export const INVENTORY_STATUS = {
  active: "In Stock",
  inactive: "Out of Stock"
};
