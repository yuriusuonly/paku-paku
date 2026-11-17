/**
 * Transaction domain constants.
 * @module domain/transactions/constants
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
 * Payment methods offered at kiosk checkout.
 * @type {string[]}
 */
export const PAYMENT_METHODS = ["cash", "card", "gcash"];
