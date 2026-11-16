import { badRequest } from "../shared/errors/bad-request.js";
import { notFound } from "../shared/errors/not-found.js";
import { databaseUnconfigured } from "../shared/errors/database-unconfigured.js";
import { databaseUpstream } from "../shared/errors/database-upstream.js";
import { createDatabaseClient } from "../database/instance.js";

/**
 * Invoice data access.
 * @module repositories/invoice-repository
 */

const INVOICE_SELECT =
  "id, invoice_number, order_id, sale_id, customer_id, status, issue_date, due_date, subtotal_cents, tax_cents, total_cents, currency, notes, billing_name, billing_email, qr_payload, created_at, updated_at";

function resolveClient(client) {
  if (client) return client;
  try { return createDatabaseClient(); } catch (error) {
    throw databaseUnconfigured("Database is not configured for server routes.", error);
  }
}

/**
 * Lists invoices visible to the current client (RLS-scoped).
 *
 * @param {import("../database/instance.js").DatabaseClient} [client] - Database client.
 * @returns {Promise<{invoices: object[]}>} Invoices payload.
 */
export async function listInvoices(client) {
  const database = resolveClient(client);
  const { data, error } = await database.from("invoices").select(INVOICE_SELECT).order("created_at", { ascending: false });
  if (error) throw databaseUpstream("invoices_unavailable", "Could not load invoices.", error);
  return { invoices: data || [] };
}

/**
 * Gets an invoice by id.
 *
 * @param {import("../database/instance.js").DatabaseClient} client - Database client.
 * @param {string} id - Invoice id.
 * @returns {Promise<{invoice: object}>} Invoice payload.
 */
export async function getInvoiceById(client, id) {
  if (!id) throw badRequest("invalid_invoice", "Invoice id is required.");
  const database = resolveClient(client);
  const { data, error } = await database.from("invoices").select(INVOICE_SELECT).eq("id", id).single();
  if (error || !data) {
    if (error?.code === "PGRST116" || !data) throw notFound("invoice_not_found", "Invoice not found.");
    throw databaseUpstream("invoices_unavailable", "Could not load the invoice.", error);
  }
  return { invoice: data };
}

/**
 * Updates an invoice (admin).
 *
 * @param {import("../database/instance.js").DatabaseClient} client - Database client.
 * @param {string} id - Invoice id.
 * @param {object} input - Fields to update.
 * @returns {Promise<{invoice: object}>} Updated invoice.
 */
export async function updateInvoice(client, id, input) {
  if (!id) throw badRequest("invalid_invoice", "Invoice id is required.");
  const database = resolveClient(client);
  const payload = { updated_at: new Date().toISOString() };
  for (const key of ["status", "due_date", "notes", "billing_name", "billing_email"]) {
    if (Object.prototype.hasOwnProperty.call(input, key)) payload[key] = input[key] ?? null;
  }
  if (Object.keys(payload).length === 1) throw badRequest("invalid_invoice", "No invoice fields to update.");
  const { data, error } = await database.from("invoices").update(payload).eq("id", id).select(INVOICE_SELECT).single();
  if (error || !data) {
    if (error?.code === "PGRST116" || !data) throw notFound("invoice_not_found", "Invoice not found.");
    throw databaseUpstream("invoice_update_failed", "Could not update the invoice.", error);
  }
  return { invoice: data };
}

/**
 * Deletes an invoice (admin).
 *
 * @param {import("../database/instance.js").DatabaseClient} client - Database client.
 * @param {string} id - Invoice id.
 * @returns {Promise<{id: string}>} Deleted id.
 */
export async function deleteInvoice(client, id) {
  if (!id) throw badRequest("invalid_invoice", "Invoice id is required.");
  const database = resolveClient(client);
  const { data, error } = await database.from("invoices").delete().eq("id", id).select("id").single();
  if (error || !data) {
    if (error?.code === "PGRST116" || !data) throw notFound("invoice_not_found", "Invoice not found.");
    throw databaseUpstream("invoice_delete_failed", "Could not delete the invoice.", error);
  }
  return { id: data.id };
}
