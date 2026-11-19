/**
 * Order pricing rules.
 * @module domain/orders/pricing
 */

/**
 * Flat discount applied when an order has both a main dish and a drink.
 * @type {number}
 */
export const MEAL_DISCOUNT_CENTS = 2000;

/**
 * Calculates the undiscounted subtotal for line items.
 *
 * @param {Array<{quantity?: number, unit_price_cents?: number, line_total_cents?: number}>} items
 * @returns {number}
 */
export function calculateOrderSubtotal(items) {
  return (items || []).reduce((sum, item) => {
    if (Number.isFinite(Number(item?.line_total_cents))) {
      return sum + Number(item.line_total_cents);
    }
    return sum + Number(item?.quantity || 0) * Number(item?.unit_price_cents || 0);
  }, 0);
}

/**
 * Whether the order includes at least one main dish and one drink.
 *
 * @param {Array<{category?: string, quantity?: number}>} items
 * @returns {boolean}
 */
export function hasMealPair(items) {
  const active = (items || []).filter((item) => Number(item?.quantity || 0) > 0);
  return active.some((item) => item.category === "food")
    && active.some((item) => item.category === "beverage");
}

/**
 * Calculates the meal discount, capped at the subtotal.
 *
 * @param {Array<{category?: string, quantity?: number, unit_price_cents?: number, line_total_cents?: number}>} items
 * @returns {number}
 */
export function getMealDiscountCents(items) {
  if (!hasMealPair(items)) return 0;
  return Math.min(MEAL_DISCOUNT_CENTS, calculateOrderSubtotal(items));
}

/**
 * Calculates subtotal, discount, and final total for an order.
 *
 * @param {Array<{category?: string, quantity?: number, unit_price_cents?: number, line_total_cents?: number}>} items
 * @returns {{subtotalCents: number, discountCents: number, totalCents: number}}
 */
export function calculateOrderTotals(items) {
  const subtotalCents = calculateOrderSubtotal(items);
  const discountCents = getMealDiscountCents(items);
  return {
    subtotalCents,
    discountCents,
    totalCents: Math.max(0, subtotalCents - discountCents)
  };
}
