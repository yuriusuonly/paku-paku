/**
 * Order status rules.
 * @module domain/orders/status
 */

/**
 * Whether a order status is cancelled.
 * @param {unknown} status
 * @returns {boolean}
 */
export function isCancelled(status) {
  return status === "cancelled";
}

/**
 * Whether a order status is completed.
 * @param {unknown} status
 * @returns {boolean}
 */
export function isCompleted(status) {
  return status === "completed";
}

/**
 * Resolves a payment status with a safe fallback.
 *
 * @param {unknown} value - Requested payment status.
 * @param {string} fallback - Fallback status.
 * @returns {string}
 */
export function resolvePaymentStatus(value, fallback) {
  return typeof value === "string" && value ? value : fallback;
}
