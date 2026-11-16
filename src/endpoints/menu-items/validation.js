import { z } from "zod";
import { hasOwn, parseWithSchema, requireUpdateFields } from "../../shared/validation/request.js";

/**
 * Zod schemas for menu item request validation.
 * Shared by collection and by-id endpoints.
 * @module endpoints/menu-items/validation
 */

const nullableString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().trim().nullable()
);

const integer = z.coerce.number().int();
const nonNegativeInteger = integer.pipe(z.number().min(0));

const createSchema = z.object({
  name: z.string().trim().min(1),
  description: nullableString.optional().default(null),
  price_cents: nonNegativeInteger,
  is_available: z.boolean(),
  is_best_seller: z.boolean().default(false),
  sort_order: z.preprocess((value) => (value === "" ? 0 : value), integer).optional()
});

const partialSchema = z.preprocess((value) => {
  const body = { ...value };
  if (hasOwn(body, "sort_order") && (body.sort_order === "" || body.sort_order == null)) {
    delete body.sort_order;
  }
  return body;
}, z.object({
  name: z.string().trim().min(1).optional(),
  description: nullableString.optional(),
  price_cents: nonNegativeInteger.optional(),
  is_available: z.boolean().optional(),
  is_best_seller: z.boolean().optional(),
  sort_order: integer.optional()
}));

/**
 * Normalizes and validates menu item input.
 *
 * @param {Record<string, any>} body
 * @param {{partial?: boolean}} [options]
 * @returns {Record<string, any>}
 */
export function normalizeMenuItemInput(body, { partial = false } = {}) {
  const input = parseWithSchema(partial ? partialSchema : createSchema, body, {
    code: "invalid_menu_item",
    message: partial ? "Invalid menu item fields." : "Invalid menu item."
  });

  if (partial) {
    requireUpdateFields(input, {
      code: "invalid_menu_item",
      message: "No menu item fields to update."
    });
  }

  return input;
}
