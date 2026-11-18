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
 * Supported order statuses.
 * @type {string[]}
 */
export const ORDER_STATUSES = ["Pending", "Paid", "Refunded", "Voided"];

/**
 * Payment methods offered at kiosk checkout.
 * @type {string[]}
 */
export const PAYMENT_METHODS = ["cash", "card", "gcash"];
