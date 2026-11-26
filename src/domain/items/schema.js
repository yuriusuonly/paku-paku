import { z } from "zod";
import { hasOwn } from "../../validation/request.js";

/**
 * Item domain schemas shared by server validation and admin forms.
 * @module domain/items/schema
 */

const nullableString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().trim().nullable()
);

const integer = z.coerce.number().int();
const nonNegativeInteger = integer.pipe(z.number().min(0));

/**
 * Item create schema.
 * @type {import("zod").ZodType}
 */
export const itemCreateSchema = z.object({
  name: z.string().trim().min(1),
  description: nullableString.optional().default(null),
  price_cents: nonNegativeInteger,
  is_available: z.boolean(),
  is_best_seller: z.boolean().default(false),
  sort_order: z.preprocess((value) => (value === "" ? 0 : value), integer).optional()
});

/**
 * Item partial update schema.
 * @type {import("zod").ZodType}
 */
export const itemPartialSchema = z.preprocess((value) => {
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
