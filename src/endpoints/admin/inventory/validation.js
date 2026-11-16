import { z } from "zod";
import { parseWithSchema, requireUpdateFields } from "../../../shared/validation/request.js";

/**
 * Zod schemas for inventory item request validation.
 * Shared by collection and by-id endpoints.
 * @module endpoints/admin/inventory/validation
 */

const nullableString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().trim().nullable()
);

const nonNegativeInteger = z.coerce.number().int().min(0);

const createSchema = z.object({
  name: z.string().trim().min(1),
  sku: nullableString.optional().default(null),
  description: nullableString.optional().default(null),
  quantity: nonNegativeInteger.default(0),
  unit: nullableString.optional().default(null),
  reorder_level: nonNegativeInteger.default(0),
  unit_cost_cents: nonNegativeInteger.default(0),
  menu_item_id: nullableString.optional().default(null),
  is_active: z.boolean()
});

const partialSchema = z.object({
  name: z.string().trim().min(1).optional(),
  sku: nullableString.optional(),
  description: nullableString.optional(),
  quantity: nonNegativeInteger.optional(),
  unit: nullableString.optional(),
  reorder_level: nonNegativeInteger.optional(),
  unit_cost_cents: nonNegativeInteger.optional(),
  menu_item_id: nullableString.optional(),
  is_active: z.boolean().optional()
});

/**
 * Normalizes and validates inventory item input.
 *
 * @param {Record<string, any>} body
 * @param {{partial?: boolean}} [options]
 * @returns {Record<string, any>}
 */
export function normalizeInventoryInput(body, { partial = false } = {}) {
  const input = parseWithSchema(partial ? partialSchema : createSchema, body, {
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
