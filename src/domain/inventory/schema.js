import { z } from "zod";

/**
 * Inventory item domain schemas shared by server validation and admin forms.
 * @module domain/inventory/schema
 */

const nullableString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().trim().nullable()
);

const nonNegativeInteger = z.coerce.number().int().min(0);

/**
 * Inventory item create schema.
 * @type {import("zod").ZodType}
 */
export const inventoryItemCreateSchema = z.object({
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

/**
 * Inventory item partial update schema.
 * @type {import("zod").ZodType}
 */
export const inventoryItemPartialSchema = z.object({
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
