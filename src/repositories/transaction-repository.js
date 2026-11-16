import { badRequest } from "../shared/errors/bad-request.js";
import { notFound } from "../shared/errors/not-found.js";
import { databaseUnconfigured } from "../shared/errors/database-unconfigured.js";
import { databaseUpstream } from "../shared/errors/database-upstream.js";
import { createDatabaseClient } from "../database/instance.js";

/**
 * Unified buy/sell transaction data access.
 * Backed by `orders` and `order_items` tables.
 * @module repositories/transaction-repository
 */

const TRANSACTION_SELECT =
  "id, order_number, kind, customer_id, status, payment_status, payment_method, subtotal_cents, total_cents, currency, notes, customer_name, customer_email, customer_phone, qr_payload, placed_at, created_at, updated_at";
const ITEM_SELECT =
  "id, order_id, menu_item_id, inventory_item_id, item_name, quantity, unit_price_cents, line_total_cents, created_at";

function resolveClient(client) {
  if (client) return client;
  try {
    return createDatabaseClient();
  } catch (error) {
    throw databaseUnconfigured("Database is not configured for server routes.", error);
  }
}

async function attachItems(database, transactions) {
  if (!transactions.length) return [];
  const ids = transactions.map((t) => t.id);
  const { data, error } = await database
    .from("order_items")
    .select(ITEM_SELECT)
    .in("order_id", ids)
    .order("created_at", { ascending: true });
  if (error) throw databaseUpstream("transactions_unavailable", "Could not load transaction items.", error);
  const grouped = new Map();
  for (const item of data || []) {
    const list = grouped.get(item.order_id) || [];
    list.push(item);
    grouped.set(item.order_id, list);
  }
  return transactions.map((t) => ({ ...t, items: grouped.get(t.id) || [] }));
}

function normalizeItems(items) {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) throw badRequest("invalid_transaction", "Transaction must include at least one item.");
  return list.map((item, index) => {
    const itemName = item.item_name != null ? String(item.item_name).trim() : "";
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unit_price_cents ?? 0);
    if (!itemName) throw badRequest("invalid_transaction", `Item ${index + 1}: name is required.`);
    if (!Number.isInteger(quantity) || quantity <= 0) throw badRequest("invalid_transaction", `Item ${index + 1}: quantity must be a positive integer.`);
    if (!Number.isInteger(unitPrice) || unitPrice < 0) throw badRequest("invalid_transaction", `Item ${index + 1}: unit price must be a non-negative integer.`);
    return {
      menu_item_id: item.menu_item_id || null,
      inventory_item_id: item.inventory_item_id || null,
      item_name: itemName,
      quantity,
      unit_price_cents: unitPrice,
      line_total_cents: quantity * unitPrice
    };
  });
}

async function applyInventoryDecrements(database, items) {
  for (const item of items) {
    if (!item.inventory_item_id || !Number.isInteger(item.quantity) || item.quantity <= 0) continue;
    const { data: current, error: readError } = await database
      .from("inventory_items")
      .select("id, quantity")
      .eq("id", item.inventory_item_id)
      .single();
    if (readError || !current) continue;
    const nextQuantity = Math.max(0, Number(current.quantity || 0) - item.quantity);
    await database
      .from("inventory_items")
      .update({ quantity: nextQuantity, updated_at: new Date().toISOString() })
      .eq("id", current.id);
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
  const { data, error } = await database
    .from("orders")
    .select(TRANSACTION_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw databaseUpstream("transactions_unavailable", "Could not load transactions.", error);
  return { transactions: await attachItems(database, data || []) };
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
  const { data, error } = await database.from("orders").select(TRANSACTION_SELECT).eq("id", id).single();
  if (error || !data) {
    if (error?.code === "PGRST116" || !data) throw notFound("transaction_not_found", "Transaction not found.");
    throw databaseUpstream("transactions_unavailable", "Could not load the transaction.", error);
  }
  const [transaction] = await attachItems(database, [data]);
  return { transaction };
}

/**
 * Creates a buy transaction from customer checkout.
 *
 * @param {import("../database/instance.js").DatabaseClient} client - Authenticated database client.
 * @param {object} input - Transaction payload including items.
 * @param {{customerId: string, profile?: object}} context - Auth/customer context.
 * @returns {Promise<{transaction: object}>} Created transaction.
 */
export async function createBuyTransaction(client, input, { customerId, profile }) {
  const database = resolveClient(client);
  if (!customerId) throw badRequest("invalid_transaction", "Customer account is required.");
  const items = normalizeItems(input.items);
  const subtotal = items.reduce((sum, item) => sum + item.line_total_cents, 0);
  const paymentStatus = input.payment_status === "paid" ? "paid" : "unpaid";

  const payload = {
    kind: "buy",
    customer_id: customerId,
    status: input.status || "pending",
    payment_status: paymentStatus,
    payment_method: input.payment_method || null,
    subtotal_cents: subtotal,
    total_cents: subtotal,
    currency: input.currency || "PHP",
    notes: input.notes || null,
    customer_name: input.customer_name || profile?.full_name || null,
    customer_email: input.customer_email || profile?.email || null,
    customer_phone: input.customer_phone || profile?.phone || null
  };

  const { data: row, error } = await database.from("orders").insert(payload).select(TRANSACTION_SELECT).single();
  if (error || !row) throw databaseUpstream("transaction_create_failed", "Could not create the transaction.", error);

  const itemRows = items.map((item) => ({ ...item, order_id: row.id }));
  const { error: itemsError } = await database.from("order_items").insert(itemRows);
  if (itemsError) {
    await database.from("orders").delete().eq("id", row.id);
    throw databaseUpstream("transaction_create_failed", "Could not create the transaction items.", itemsError);
  }

  const qrPayload = `TXN:${row.order_number}|ID:${row.id}|TOTAL:${row.total_cents}`;
  const { data: withQr, error: qrError } = await database
    .from("orders")
    .update({ qr_payload: qrPayload, updated_at: new Date().toISOString() })
    .eq("id", row.id)
    .select(TRANSACTION_SELECT)
    .single();
  const finalRow = !qrError && withQr ? withQr : { ...row, qr_payload: qrPayload };
  const [transaction] = await attachItems(database, [finalRow]);
  return { transaction };
}

/**
 * Creates a sell/admin transaction.
 *
 * @param {import("../database/instance.js").DatabaseClient} client - Database client.
 * @param {object} input - Transaction payload including items.
 * @param {{kind?: string}} [options] - Creation options.
 * @returns {Promise<{transaction: object}>} Created transaction.
 */
export async function createTransaction(client, input, options = {}) {
  const database = resolveClient(client);
  const kind = options.kind === "buy" ? "buy" : "sell";
  const items = normalizeItems(input.items);
  const subtotal = items.reduce((sum, item) => sum + item.line_total_cents, 0);
  const status = input.status || "completed";
  const paymentStatus = input.payment_status || (status === "completed" ? "paid" : "unpaid");

  const payload = {
    kind,
    customer_id: input.customer_id || null,
    status,
    payment_status: paymentStatus,
    payment_method: input.payment_method || null,
    subtotal_cents: subtotal,
    total_cents: subtotal,
    currency: input.currency || "PHP",
    notes: input.notes || null,
    customer_name: input.customer_name || null,
    customer_email: input.customer_email || null,
    customer_phone: input.customer_phone || null
  };

  const { data: row, error } = await database.from("orders").insert(payload).select(TRANSACTION_SELECT).single();
  if (error || !row) throw databaseUpstream("transaction_create_failed", "Could not create the transaction.", error);

  const itemRows = items.map((item) => ({ ...item, order_id: row.id }));
  const { error: itemsError } = await database.from("order_items").insert(itemRows);
  if (itemsError) {
    await database.from("orders").delete().eq("id", row.id);
    throw databaseUpstream("transaction_create_failed", "Could not create the transaction items.", itemsError);
  }

  const qrPayload = `TXN:${row.order_number}|ID:${row.id}|TOTAL:${row.total_cents}`;
  await database.from("orders").update({ qr_payload: qrPayload, updated_at: new Date().toISOString() }).eq("id", row.id);

  if (kind === "sell" && status === "completed") {
    await applyInventoryDecrements(database, itemRows);
  }

  return getTransactionById(database, row.id);
}

/**
 * Updates a transaction and optionally replaces its items.
 *
 * @param {import("../database/instance.js").DatabaseClient} client - Database client.
 * @param {string} id - Transaction id.
 * @param {object} input - Fields to update.
 * @returns {Promise<{transaction: object}>} Updated transaction.
 */
export async function updateTransaction(client, id, input) {
  if (!id) throw badRequest("invalid_transaction", "Transaction id is required.");
  const database = resolveClient(client);
  const { items, ...fields } = input || {};

  const payload = { updated_at: new Date().toISOString() };
  for (const key of ["status", "payment_status", "payment_method", "notes", "customer_name", "customer_email", "customer_phone", "kind"]) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) payload[key] = fields[key] ?? null;
  }
  if (Object.keys(payload).length === 1 && !Array.isArray(items)) {
    throw badRequest("invalid_transaction", "No transaction fields to update.");
  }

  const { data, error } = await database.from("orders").update(payload).eq("id", id).select(TRANSACTION_SELECT).single();
  if (error || !data) {
    if (error?.code === "PGRST116" || !data) throw notFound("transaction_not_found", "Transaction not found.");
    throw databaseUpstream("transaction_update_failed", "Could not update the transaction.", error);
  }

  if (Array.isArray(items)) {
    const normalized = normalizeItems(items);
    const { error: deleteError } = await database.from("order_items").delete().eq("order_id", id);
    if (deleteError) throw databaseUpstream("transaction_update_failed", "Could not update transaction items.", deleteError);
    const rows = normalized.map((item) => ({ ...item, order_id: id }));
    const { error: insertError } = await database.from("order_items").insert(rows);
    if (insertError) throw databaseUpstream("transaction_update_failed", "Could not update transaction items.", insertError);
    const subtotal = normalized.reduce((sum, item) => sum + item.line_total_cents, 0);
    await database.from("orders").update({ subtotal_cents: subtotal, total_cents: subtotal, updated_at: new Date().toISOString() }).eq("id", id);
  }

  return getTransactionById(database, id);
}

/**
 * Deletes a transaction.
 *
 * @param {import("../database/instance.js").DatabaseClient} client - Database client.
 * @param {string} id - Transaction id.
 * @returns {Promise<{id: string}>} Deleted id.
 */
export async function deleteTransaction(client, id) {
  if (!id) throw badRequest("invalid_transaction", "Transaction id is required.");
  const database = resolveClient(client);
  const { data, error } = await database.from("orders").delete().eq("id", id).select("id").single();
  if (error || !data) {
    if (error?.code === "PGRST116" || !data) throw notFound("transaction_not_found", "Transaction not found.");
    throw databaseUpstream("transaction_delete_failed", "Could not delete the transaction.", error);
  }
  return { id: data.id };
}
