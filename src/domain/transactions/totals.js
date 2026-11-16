/**
 * Transaction total and QR payload rules.
 * @module domain/transactions/totals
 */

/**
 * Calculates subtotal cents from normalized line items.
 *
 * @param {Array<{line_total_cents?: number}>} items
 * @returns {number}
 */
export function calculateTransactionSubtotal(items) {
  return (items || []).reduce((sum, item) => sum + Number(item.line_total_cents || 0), 0);
}

/**
 * Builds the counter-facing QR payload.
 *
 * @param {{orderNumber?: string, id?: string, totalCents?: number}} transaction
 * @returns {string}
 */
export function buildQrPayload({ orderNumber, id, totalCents }) {
  return `TXN:${orderNumber}|ID:${id}|TOTAL:${totalCents}`;
}
