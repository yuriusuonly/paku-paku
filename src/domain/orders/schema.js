import { z } from "zod";
import {
  PAYMENT_METHODS,
  ORDER_KINDS,
  ORDER_STATUSES
} from "./constants.js";

/**
 * Order domain schemas shared by server validation and admin forms.
 * @module domain/orders/schema
 */

const nullableString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().trim().nullable()
);

/**
 * Order line item schema.
 * @type {import("zod").ZodType}
 */
export const orderItemSchema = z.object({
  item_name: z.string().trim().min(1),
  quantity: z.coerce.number().int().positive(),
  unit_price_cents: z.coerce.number().int().min(0)
}).transform((item) => ({
  ...item,
  line_total_cents: item.quantity * item.unit_price_cents
}));

/**
 * Admin order create schema.
 * @type {import("zod").ZodType}
 */
export const orderCreateSchema = z.object({
  kind: z.enum(ORDER_KINDS).default("sell"),
  status: z.enum(ORDER_STATUSES).default("Paid"),
  payment_method: nullableString.optional().default(null),
  customer_name: nullableString.optional().default(null),
  customer_email: nullableString.optional().default(null),
  customer_phone: nullableString.optional().default(null),
  notes: nullableString.optional().default(null),
  items: z.array(orderItemSchema).min(1)
});

/**
 * Public kiosk checkout schema.
 * @type {import("zod").ZodType}
 */
export const checkoutSchema = z.object({
  payment_method: z.enum(PAYMENT_METHODS).default("cash"),
  items: z.array(orderItemSchema).min(1)
});
