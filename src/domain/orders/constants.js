/**
 * Order domain constants.
 * @module domain/orders/constants
 */

/**
 * Supported order statuses.
 * @type {string[]}
 */
export const ORDER_STATUSES = ["Pending", "Paid", "Refunded", "Voided"];

/**
 * Menu categories used for automatic meal pricing.
 * @type {string[]}
 */
export const ORDER_ITEM_CATEGORIES = ["food", "beverage"];

/**
 * Payment methods offered at kiosk checkout.
 * @type {string[]}
 */
export const PAYMENT_METHODS = ["cash", "card", "gcash"];
