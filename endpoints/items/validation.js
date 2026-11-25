import { parseWithSchema, requireUpdateFields } from "../../shared/validation/request.js";
import { itemCreateSchema, itemPartialSchema } from "../../domain/items/schema.js";

/**
 * Item endpoint validation backed by domain schemas.
 * @module endpoints/items/validation
 */

/**
 * Normalizes and validates item input.
 *
 * @param {Record<string, any>} body
 * @param {{partial?: boolean}} [options]
 * @returns {Record<string, any>}
 */
export function normalizeItemInput(body, { partial = false } = {}) {
  const input = parseWithSchema(partial ? itemPartialSchema : itemCreateSchema, body, {
    code: "invalid_item",
    message: partial ? "Invalid item fields." : "Invalid item."
  });

  if (partial) {
    requireUpdateFields(input, {
      code: "invalid_item",
      message: "No item fields to update."
    });
  }

  return input;
}
