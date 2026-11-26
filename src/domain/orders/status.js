/**
 * Order status rules.
 * @module domain/orders/status
 */

/**
 * Whether an order is still pending counter confirmation.
 *
 * @param {unknown} status
 * @returns {boolean}
 */
export function isPending(status) {
  return status === "Pending";
}

/**
 * Whether an order has been paid.
 *
 * @param {unknown} status
 * @returns {boolean}
 */
export function isPaid(status) {
  return status === "Paid";
}

/**
 * Whether an order is voided.
 *
 * @param {unknown} status
 * @returns {boolean}
 */
export function isVoided(status) {
  return status === "Voided";
}

/**
 * Whether an order was refunded.
 *
 * @param {unknown} status
 * @returns {boolean}
 */
export function isRefunded(status) {
  return status === "Refunded";
}
