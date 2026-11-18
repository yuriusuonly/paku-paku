/**
 * Order domain constants.
 * @module domain/orders/constants
 */

/**
 * Supported order directions.
 * @type {string[]}
 */
export const ORDER_KINDS = ["buy", "sell"];

/**
 * Supported order lifecycle states.
 * @type {string[]}
 */
export const ORDER_STATUSES = [
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
 * Payment methods offered at kiosk checkout.
 * @type {string[]}
 */
export const PAYMENT_METHODS = ["cash", "card", "gcash"];
