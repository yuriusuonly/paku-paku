/**
 * Combo meal rules.
 * @module domain/menu/combo
 */

/**
 * Flat combo discount in cents (₱20.00).
 * @type {number}
 */
export const COMBO_DISCOUNT_CENTS = 2000;

/**
 * Builds a stable cart key for a food + drink combo selection.
 *
 * @param {{id?: string}} food - Selected main dish.
 * @param {{id?: string}} drink - Selected side drink.
 * @returns {string|null} Cart key, or `null` when the selection is incomplete.
 */
export function getComboKey(food, drink) {
  if (!food?.id || !drink?.id) return null;
  return `combo:${food.id}:${drink.id}`;
}

/**
 * Builds the human-readable snapshot name for a combo.
 *
 * @param {{name?: string}} food - Selected main dish.
 * @param {{name?: string}} drink - Selected side drink.
 * @returns {string|null} Combo name, or `null` when the selection is incomplete.
 */
export function getComboName(food, drink) {
  if (!food?.name || !drink?.name) return null;
  return `${food.name} + ${drink.name}`;
}

/**
 * Calculates the undiscounted combo price.
 *
 * @param {{price_cents?: number}} food - Selected main dish.
 * @param {{price_cents?: number}} drink - Selected side drink.
 * @returns {number} Original price in cents.
 */
export function getComboOriginalPriceCents(food, drink) {
  return Number(food?.price_cents || 0) + Number(drink?.price_cents || 0);
}

/**
 * Calculates the combo savings, capped at the original price.
 *
 * @param {{price_cents?: number}} food - Selected main dish.
 * @param {{price_cents?: number}} drink - Selected side drink.
 * @returns {number} Savings in cents.
 */
export function getComboSavingsCents(food, drink) {
  const original = getComboOriginalPriceCents(food, drink);
  if (!original) return 0;
  return Math.min(COMBO_DISCOUNT_CENTS, original);
}

/**
 * Calculates the discounted combo price.
 *
 * @param {{price_cents?: number}} food - Selected main dish.
 * @param {{price_cents?: number}} drink - Selected side drink.
 * @returns {number} Discounted price in cents.
 */
export function getComboPriceCents(food, drink) {
  return Math.max(0, getComboOriginalPriceCents(food, drink) - getComboSavingsCents(food, drink));
}

/**
 * Builds a cart line item for a food + drink combo.
 *
 * @param {{id?: string, name?: string, price_cents?: number}} food - Selected main dish.
 * @param {{id?: string, name?: string, price_cents?: number}} drink - Selected side drink.
 * @returns {{item_id: string, item_name: string, unit_price_cents: number, quantity: number}|null} Cart item, or `null` when incomplete.
 */
export function buildComboCartItem(food, drink) {
  const item_id = getComboKey(food, drink);
  const item_name = getComboName(food, drink);
  if (!item_id || !item_name) return null;

  return {
    item_id,
    item_name,
    unit_price_cents: getComboPriceCents(food, drink),
    quantity: 1
  };
}
