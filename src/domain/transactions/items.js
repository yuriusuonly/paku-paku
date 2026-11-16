import { badRequest } from "../../shared/errors/bad-request.js";

/**
 * Transaction item normalization rules.
 * @module domain/transactions/items
 */

/**
 * Normalizes transaction line items for persistence.
 *
 * @param {unknown} items - Raw line items.
 * @returns {Array<{menu_item_id: string|null, inventory_item_id: string|null, item_name: string, quantity: number, unit_price_cents: number, line_total_cents: number}>} Normalized items.
 */
export function normalizeTransactionItems(items) {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) {
    throw badRequest("invalid_transaction", "Transaction must include at least one item.");
  }

  return list.map((item, index) => {
    const entry = item && typeof item === "object" ? item : {};
    const itemName = entry.item_name != null ? String(entry.item_name).trim() : "";
    const quantity = Number(entry.quantity);
    const unitPrice = Number(entry.unit_price_cents ?? 0);

    if (!itemName) {
      throw badRequest("invalid_transaction", `Item ${index + 1}: name is required.`);
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw badRequest("invalid_transaction", `Item ${index + 1}: quantity must be a positive integer.`);
    }
    if (!Number.isInteger(unitPrice) || unitPrice < 0) {
      throw badRequest("invalid_transaction", `Item ${index + 1}: unit price must be a non-negative integer.`);
    }

    return {
      menu_item_id: entry.menu_item_id || null,
      inventory_item_id: entry.inventory_item_id || null,
      item_name: itemName,
      quantity,
      unit_price_cents: unitPrice,
      line_total_cents: quantity * unitPrice
    };
  });
}
