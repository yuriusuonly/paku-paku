import { badRequest } from "../shared/errors/bad-request.js";
import { notFound } from "../shared/errors/not-found.js";
import { databaseUnconfigured } from "../shared/errors/database-unconfigured.js";
import { databaseUpstream } from "../shared/errors/database-upstream.js";
import { createDatabaseClient } from "../database/instance.js";

/**
 * Transaction data access.
 * @module repositories/transaction-repository
 */

const TRANSACTION_SELECT =
  "id, transaction_number, order_id, invoice_id, sale_id, customer_id, type, method, status, amount_cents, currency, reference, notes, qr_payload, processed_at, created_at, updated_at";

function resolveClient(client) {
  if (client) return client;
  try { return createDatabaseClient(); } catch (error) {
    throw databaseUnconfigured("Database is not configured for server routes.", error);
  }
}

/**
 * Lists transactions visible to the current client (RLS-scoped).
 *
 * @param {import("../database/instance.js").DatabaseClient} [client] - Database client.
 * @returns {Promise<{transactions: object[]}>} Transactions payload.
 */
export async function listTransactions(client) {
  const database = resolveClient(client);
  const { data, error } = await database.from("transactions").select(TRANSACTION_SELECT).order("created_at", { ascending: false });
  if (error) throw databaseUpstream("transactions_unavailable", "Could not load transactions.", error);
  return { transactions: data || [] };
}

/**
 * Gets a transaction by id.
 *
 * @param {import("../database/instance.js").DatabaseClient} client - Database client.
 * @param {string} id - Transaction id.
 * @returns {Promise<{transaction: object}>} Transaction payload.
 */
export async function getTransactionById(client, id) {
  if (!id) throw badRequest("invalid_transaction", "Transaction id is required.");
  const database = resolveClient(client);
  const { data, error } = await database.from("transactions").select(TRANSACTION_SELECT).eq("id", id).single();
  if (error || !data) {
    if (error?.code === "PGRST116" || !data) throw notFound("transaction_not_found", "Transaction not found.");
    throw databaseUpstream("transactions_unavailable", "Could not load the transaction.", error);
  }
  return { transaction: data };
}

/**
 * Creates a transaction record (admin).
 *
 * @param {import("../database/instance.js").DatabaseClient} client - Database client.
 * @param {object} input - Transaction fields.
 * @returns {Promise<{transaction: object}>} Created transaction.
 */
export async function createTransaction(client, input) {
  const database = resolveClient(client);
  const payload = {
    order_id: input.order_id || null,
    invoice_id: input.invoice_id || null,
    sale_id: input.sale_id || null,
    customer_id: input.customer_id || null,
    type: input.type || "payment",
    method: input.method || null,
    status: input.status || "completed",
    amount_cents: Number.isInteger(input.amount_cents) ? input.amount_cents : 0,
    currency: input.currency || "PHP",
    reference: input.reference || null,
    notes: input.notes || null,
    qr_payload: input.qr_payload || `TXN|TYPE:${input.type || "payment"}|AMOUNT:${Number.isInteger(input.amount_cents) ? input.amount_cents : 0}|REF:${input.reference || ""}`
  };
  const { data, error } = await database.from("transactions").insert(payload).select(TRANSACTION_SELECT).single();
  if (error || !data) throw databaseUpstream("transaction_create_failed", "Could not create the transaction.", error);
  return { transaction: data };
}

/**
 * Updates a transaction (admin).
 *
 * @param {import("../database/instance.js").DatabaseClient} client - Database client.
 * @param {string} id - Transaction id.
 * @param {object} input - Fields to update.
 * @returns {Promise<{transaction: object}>} Updated transaction.
 */
export async function updateTransaction(client, id, input) {
  if (!id) throw badRequest("invalid_transaction", "Transaction id is required.");
  const database = resolveClient(client);
  const payload = { updated_at: new Date().toISOString() };
  for (const key of ["status", "method", "reference", "notes", "type"]) {
    if (Object.prototype.hasOwnProperty.call(input, key)) payload[key] = input[key] ?? null;
  }
  if (Object.keys(payload).length === 1) throw badRequest("invalid_transaction", "No transaction fields to update.");
  const { data, error } = await database.from("transactions").update(payload).eq("id", id).select(TRANSACTION_SELECT).single();
  if (error || !data) {
    if (error?.code === "PGRST116" || !data) throw notFound("transaction_not_found", "Transaction not found.");
    throw databaseUpstream("transaction_update_failed", "Could not update the transaction.", error);
  }
  return { transaction: data };
}

/**
 * Deletes a transaction (admin).
 *
 * @param {import("../database/instance.js").DatabaseClient} client - Database client.
 * @param {string} id - Transaction id.
 * @returns {Promise<{id: string}>} Deleted id.
 */
export async function deleteTransaction(client, id) {
  if (!id) throw badRequest("invalid_transaction", "Transaction id is required.");
  const database = resolveClient(client);
  const { data, error } = await database.from("transactions").delete().eq("id", id).select("id").single();
  if (error || !data) {
    if (error?.code === "PGRST116" || !data) throw notFound("transaction_not_found", "Transaction not found.");
    throw databaseUpstream("transaction_delete_failed", "Could not delete the transaction.", error);
  }
  return { id: data.id };
}
