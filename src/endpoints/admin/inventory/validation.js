import { parseWithSchema, requireUpdateFields } from "../../../shared/validation/request.js";
import {
  inventoryItemCreateSchema,
  inventoryItemPartialSchema
} from "../../../domain/inventory/schema.js";

/**
 * Inventory item endpoint validation backed by domain schemas.
 * @module endpoints/admin/inventory/validation
 */

/**
 * Normalizes and validates inventory item input.
 *
 * @param {Record<string, any>} body
 * @param {{partial?: boolean}} [options]
 * @returns {Record<string, any>}
 */
export function normalizeInventoryInput(body, { partial = false } = {}) {
  const input = parseWithSchema(partial ? inventoryItemPartialSchema : inventoryItemCreateSchema, body, {
    code: "invalid_inventory_item",
    message: partial ? "Invalid inventory item fields." : "Invalid inventory item."
  });

  if (partial) {
    requireUpdateFields(input, {
      code: "invalid_inventory_item",
      message: "No inventory item fields to update."
    });
  }

  return input;
}
