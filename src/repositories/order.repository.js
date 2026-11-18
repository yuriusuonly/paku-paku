import { randomUUID } from "node:crypto";
import { badRequest } from "../shared/errors/bad-request.js";
import { notFound } from "../shared/errors/not-found.js";
import { databaseUnconfigured } from "../shared/errors/database-unconfigured.js";
import { databaseUpstream } from "../shared/errors/database-upstream.js";
import { createDatabaseClient } from "../database/instance.js";
import { normalizeOrderItems } from "../domain/orders/items.js";
import { calculateOrderSubtotal, buildQrPayload } from "../domain/orders/totals.js";
import { isCompleted, resolvePaymentStatus } from "../domain/orders/status.js";

/**
 * Unified buy/sell order data access.
 * Backed by `orders` and `order_items` tables.
 * @module repositories/order.repository
 */

const ORDER_SELECT =
  "id, order_number, kind, customer_id, status, payment_status, payment_method, subtotal_cents, total_cents, currency, notes, customer_name, customer_email, customer_phone, qr_payload, placed_at, created_at, updated_at";
const ITEM_SELECT =
  "id, order_id, menu_item_id, item_name, quantity, unit_price_cents, line_total_cents, created_at";

function resolveClient(client) {
  if (client) return client;
  try {
    return createDatabaseClient();
  } catch (error) {
    throw databaseUnconfigured("Database is not configured for server routes.", error);
  }
}

async function attachItems(database, orders) {
  if (!orders.length) return [];
  const ids = orders.map((t) => t.id);
  const { data, error } = await database
    .from("order_items")
    .select(ITEM_SELECT)
    .in("order_id", ids)
    .order("created_at", { ascending: true });
  if (error) throw databaseUpstream("orders_unavailable", "Could not load order items.", error);
  const grouped = new Map();
  for (const item of data || []) {
    const list = grouped.get(item.order_id) || [];
    list.push(item);
    grouped.set(item.order_id, list);
  }
  return orders.map((t) => ({ ...t, items: grouped.get(t.id) || [] }));
}

/**
 * Lists orders visible to the current client (RLS-scoped).
 *
 * @param {import("../database/instance.js").DatabaseClient} [client] - Database client.
 * @returns {Promise<{orders: object[]}>} Orders payload.
 */
export async function listOrders(client) {
  const database = resolveClient(client);
  const { data, error } = await database
    .from("orders")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw databaseUpstream("orders_unavailable", "Could not load orders.", error);
  return { orders: await attachItems(database, data || []) };
}

/**
 * Gets a order by id.
 *
 * @param {import("../database/instance.js").DatabaseClient} client - Database client.
 * @param {string} id - Order id.
 * @returns {Promise<{order: object}>} Order payload.
 */
export async function getOrderById(client, id) {
  if (!id) throw badRequest("invalid_order", "Order id is required.");
  const database = resolveClient(client);
  const { data, error } = await database.from("orders").select(ORDER_SELECT).eq("id", id).single();
  if (error || !data) {
    if (error?.code === "PGRST116" || !data) throw notFound("order_not_found", "Order not found.");
    throw databaseUpstream("orders_unavailable", "Could not load the order.", error);
  }
  const [order] = await attachItems(database, [data]);
  return { order };
}

/**
 * Creates a public kiosk checkout order and counter QR payload.
 *
 * @param {import("../database/instance.js").DatabaseClient} client - Database client.
 * @param {{payment_method?: string, items: object[]}} input - Checkout payload.
 * @returns {Promise<{order: object}>} Created order.
 */
export async function createCheckoutOrder(client, input) {
  const database = resolveClient(client);
  const items = normalizeOrderItems(input.items);
  const subtotal = calculateOrderSubtotal(items);
  const paymentMethod = input.payment_method || "cash";
  const id = randomUUID();
  const orderNumber = `ORD-${randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
  const now = new Date().toISOString();

  const qrPayload = buildQrPayload({
    orderNumber,
    id,
    totalCents: subtotal,
    paymentMethod,
    items
  });

  const payload = {
    id,
    order_number: orderNumber,
    kind: "buy",
    customer_id: null,
    status: "pending",
    payment_status: "unpaid",
    payment_method: paymentMethod,
    subtotal_cents: subtotal,
    total_cents: subtotal,
    currency: input.currency || "PHP",
    notes: input.notes || null,
    qr_payload: qrPayload,
    placed_at: now,
    created_at: now,
    updated_at: now
  };

  const { error } = await database.from("orders").insert(payload);
  if (error) throw databaseUpstream("order_create_failed", "Could not place the order.", error);

  const itemRows = items.map((item) => ({ ...item, order_id: id }));
  const { error: itemsError } = await database.from("order_items").insert(itemRows);
  if (itemsError) {
    await database.from("orders").delete().eq("id", id);
    throw databaseUpstream("order_create_failed", "Could not save the order items.", itemsError);
  }

  const responseItems = itemRows.map((item, index) => ({ ...item, id: item.id || `line-${index + 1}` }));
  return { order: { ...payload, items: responseItems } };
}

/**
 * Creates a sell/admin order.
 *
 * @param {import("../database/instance.js").DatabaseClient} client - Database client.
 * @param {object} input - Order payload including items.
 * @param {{kind?: string}} [options] - Creation options.
 * @returns {Promise<{order: object}>} Created order.
 */
export async function createOrder(client, input, options = {}) {
  const database = resolveClient(client);
  const kind = options.kind === "buy" ? "buy" : "sell";
  const items = normalizeOrderItems(input.items);
  const subtotal = calculateOrderSubtotal(items);
  const status = input.status || "completed";
  const paymentStatus = resolvePaymentStatus(input.payment_status, isCompleted(status) ? "paid" : "unpaid");

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

  const { data: row, error } = await database.from("orders").insert(payload).select(ORDER_SELECT).single();
  if (error || !row) throw databaseUpstream("order_create_failed", "Could not create the order.", error);

  const itemRows = items.map((item) => ({ ...item, order_id: row.id }));
  const { error: itemsError } = await database.from("order_items").insert(itemRows);
  if (itemsError) {
    await database.from("orders").delete().eq("id", row.id);
    throw databaseUpstream("order_create_failed", "Could not create the order items.", itemsError);
  }

  const qrPayload = buildQrPayload({ orderNumber: row.order_number, id: row.id, totalCents: row.total_cents });
  await database.from("orders").update({ qr_payload: qrPayload, updated_at: new Date().toISOString() }).eq("id", row.id);

  return getOrderById(database, row.id);
}

/**
 * Updates a order and optionally replaces its items.
 *
 * @param {import("../database/instance.js").DatabaseClient} client - Database client.
 * @param {string} id - Order id.
 * @param {object} input - Fields to update.
 * @returns {Promise<{order: object}>} Updated order.
 */
export async function updateOrder(client, id, input) {
  if (!id) throw badRequest("invalid_order", "Order id is required.");
  const database = resolveClient(client);
  const { items, ...fields } = input || {};

  const payload = { updated_at: new Date().toISOString() };
  for (const key of ["status", "payment_status", "payment_method", "notes", "customer_name", "customer_email", "customer_phone", "kind"]) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) payload[key] = fields[key] ?? null;
  }
  if (Object.keys(payload).length === 1 && !Array.isArray(items)) {
    throw badRequest("invalid_order", "No order fields to update.");
  }

  const { data, error } = await database.from("orders").update(payload).eq("id", id).select(ORDER_SELECT).single();
  if (error || !data) {
    if (error?.code === "PGRST116" || !data) throw notFound("order_not_found", "Order not found.");
    throw databaseUpstream("order_update_failed", "Could not update the order.", error);
  }

  if (Array.isArray(items)) {
    const normalized = normalizeOrderItems(items);
    const { error: deleteError } = await database.from("order_items").delete().eq("order_id", id);
    if (deleteError) throw databaseUpstream("order_update_failed", "Could not update order items.", deleteError);
    const rows = normalized.map((item) => ({ ...item, order_id: id }));
    const { error: insertError } = await database.from("order_items").insert(rows);
    if (insertError) throw databaseUpstream("order_update_failed", "Could not update order items.", insertError);
    const subtotal = calculateOrderSubtotal(normalized);
    await database.from("orders").update({ subtotal_cents: subtotal, total_cents: subtotal, updated_at: new Date().toISOString() }).eq("id", id);
  }

  return getOrderById(database, id);
}

/**
 * Deletes a order.
 *
 * @param {import("../database/instance.js").DatabaseClient} client - Database client.
 * @param {string} id - Order id.
 * @returns {Promise<{id: string}>} Deleted id.
 */
export async function deleteOrder(client, id) {
  if (!id) throw badRequest("invalid_order", "Order id is required.");
  const database = resolveClient(client);
  const { data, error } = await database.from("orders").delete().eq("id", id).select("id").single();
  if (error || !data) {
    if (error?.code === "PGRST116" || !data) throw notFound("order_not_found", "Order not found.");
    throw databaseUpstream("order_delete_failed", "Could not delete the order.", error);
  }
  return { id: data.id };
}
