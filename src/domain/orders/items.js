import { badRequest } from "../../shared/errors/bad-request.js";

/**
 * Order item normalization rules.
 * @module domain/orders/items
 */

/**
 * Normalizes order line items for persistence.
 *
 * @param {unknown} items - Raw line items.
 * @returns {Array<{item_name: string, quantity: number, unit_price_cents: number, line_total_cents: number}>} Normalized snapshot items.
 */
export function normalizeOrderItems(items) {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) {
    throw badRequest("invalid_order", "Order must include at least one item.");
  }

  return list.map((item, index) => {
    const entry = item && typeof item === "object" ? item : {};
    const itemName = entry.item_name != null ? String(entry.item_name).trim() : "";
    const quantity = Number(entry.quantity);
    const unitPrice = Number(entry.unit_price_cents ?? 0);

    if (!itemName) {
      throw badRequest("invalid_order", `Item ${index + 1}: name is required.`);
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw badRequest("invalid_order", `Item ${index + 1}: quantity must be a positive integer.`);
    }
    if (!Number.isInteger(unitPrice) || unitPrice < 0) {
      throw badRequest("invalid_order", `Item ${index + 1}: unit price must be a non-negative integer.`);
    }

    return {
      item_name: itemName,
      quantity,
      unit_price_cents: unitPrice,
      line_total_cents: quantity * unitPrice
    };
  });
}
