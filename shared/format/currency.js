import { currency } from "../constants/config.js";

/**
 * Currency formatting helpers.
 * @module shared/format/currency
 */

/**
 * Formats a minor-unit amount (cents) as a currency string.
 * @param {number|string|null|undefined} cents
 * @param {{symbol?: string}} [options]
 * @returns {string}
 */
export function formatCurrencyCents(cents, { symbol = currency.symbol } = {}) {
  const amount = Number(cents || 0) / 100;
  return `${symbol}${amount.toFixed(2)}`;
}
