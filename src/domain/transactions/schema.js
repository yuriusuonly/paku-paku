import { z } from "zod";
import {
  PAYMENT_STATUSES,
  TRANSACTION_KINDS,
  TRANSACTION_STATUSES
} from "./constants.js";

/**
 * Transaction domain schemas shared by server validation and admin forms.
 * @module domain/transactions/schema
 */

const nullableString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().trim().nullable()
);

/**
 * Transaction line item schema.
 * @type {import("zod").ZodType}
 */
export const transactionItemSchema = z.object({
  item_name: z.string().trim().min(1),
  quantity: z.coerce.number().int().positive(),
  unit_price_cents: z.coerce.number().int().min(0),
  menu_item_id: nullableString.optional().default(null)
}).transform((item) => ({
  ...item,
  line_total_cents: item.quantity * item.unit_price_cents
}));

/**
 * Admin transaction create schema.
 * @type {import("zod").ZodType}
 */
export const transactionCreateSchema = z.object({
  kind: z.enum(TRANSACTION_KINDS).default("sell"),
  status: z.enum(TRANSACTION_STATUSES).default("completed"),
  payment_status: z.enum(PAYMENT_STATUSES).default("paid"),
  payment_method: nullableString.optional().default(null),
  customer_name: nullableString.optional().default(null),
  customer_email: nullableString.optional().default(null),
  customer_phone: nullableString.optional().default(null),
  notes: nullableString.optional().default(null),
  items: z.array(transactionItemSchema).min(1)
});
