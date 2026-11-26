/**
 * Order total and QR payload rules.
 * @module domain/orders/totals
 */

/**
 * Calculates subtotal cents from normalized line items.
 *
 * @param {Array<{line_total_cents?: number}>} items
 * @returns {number}
 */
export function calculateOrderSubtotal(items) {
  return (items || []).reduce((sum, item) => sum + Number(item.line_total_cents || 0), 0);
}

/**
 * Builds the counter-facing QR payload with payment method and order summary.
 *
 * @param {{orderNumber?: string, id?: string, totalCents?: number, paymentMethod?: string|null, items?: Array<{item_name?: string, quantity?: number}>}} order
 * @returns {string}
 */
export function buildQrPayload({ orderNumber, id, totalCents, paymentMethod, items }) {
  const base = `ORD:${orderNumber}|ID:${id}|TOTAL:${totalCents}`;
  if (!paymentMethod && !Array.isArray(items)) return base;
  const payment = `PAY:${paymentMethod || "cash"}`;
  const summary = Array.isArray(items) && items.length
    ? `|ITEMS:${items.map((item) => `${item.item_name}x${item.quantity}`).join(",")}`
    : "";
  return `${base}|${payment}${summary}`;
}
