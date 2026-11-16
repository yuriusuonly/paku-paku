import { badRequest } from "../shared/errors/bad-request.js";
import { notFound } from "../shared/errors/not-found.js";
import { databaseUnconfigured } from "../shared/errors/database-unconfigured.js";
import { databaseUpstream } from "../shared/errors/database-upstream.js";
import { createDatabaseClient } from "../database/instance.js";

/**
 * Order data access and checkout orchestration.
 * @module repositories/order-repository
 */

const ORDER_SELECT =
  "id, order_number, customer_id, status, payment_status, subtotal_cents, total_cents, currency, notes, customer_name, customer_email, customer_phone, qr_payload, placed_at, created_at, updated_at";
const ORDER_ITEM_SELECT =
  "id, order_id, menu_item_id, inventory_item_id, item_name, quantity, unit_price_cents, line_total_cents, created_at";
const TRANSACTION_SELECT =
  "id, transaction_number, order_id, invoice_id, sale_id, customer_id, type, method, status, amount_cents, currency, reference, notes, qr_payload, processed_at, created_at, updated_at";

function resolveClient(client) {
  if (client) return client;
  try {
    return createDatabaseClient();
  } catch (error) {
    throw databaseUnconfigured("Database is not configured for server routes.", error);
  }
}

async function attachOrderItems(database, orders) {
  if (!orders.length) return [];
  const ids = orders.map((o) => o.id);
  const { data, error } = await database
    .from("order_items")
    .select(ORDER_ITEM_SELECT)
    .in("order_id", ids)
    .order("created_at", { ascending: true });
  if (error) throw databaseUpstream("orders_unavailable", "Could not load order items.", error);
  const grouped = new Map();
  for (const item of data || []) {
    const list = grouped.get(item.order_id) || [];
    list.push(item);
    grouped.set(item.order_id, list);
  }
  return orders.map((o) => ({ ...o, items: grouped.get(o.id) || [] }));
}

/**
 * Lists orders visible to the current database client (RLS-scoped).
 *
 * @param {import("../database/instance.js").DatabaseClient} [client] - Database client.
 * @returns {Promise<{orders: object[]}>} Orders payload.
 */
export async function listOrders(client) {
  const database = resolveClient(client);
  const { data, error } = await database.from("orders").select(ORDER_SELECT).order("created_at", { ascending: false });
  if (error) throw databaseUpstream("orders_unavailable", "Could not load orders.", error);
  return { orders: await attachOrderItems(database, data || []) };
}

/**
 * Gets a single order by id (RLS-scoped).
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
  const [order] = await attachOrderItems(database, [data]);
  return { order };
}

/**
 * Creates a transaction record for an order.
 *
 * @param {import("../database/instance.js").DatabaseClient} database - Database client.
 * @param {object} params - Transaction params.
 * @returns {Promise<object>} Transaction row.
 */
async function createTransactionForOrder(database, params) {
  const payload = {
    order_id: params.order_id,
    invoice_id: null,
    customer_id: params.customer_id,
    type: params.type || "payment",
    method: params.method || null,
    status: params.status || "completed",
    amount_cents: params.amount_cents ?? 0,
    currency: params.currency || "PHP",
    reference: params.reference || null,
    notes: params.notes || null,
    qr_payload: `TXN|ORDER:${params.order_number || params.order_id}|AMOUNT:${params.amount_cents ?? 0}`
  };
  const { data, error } = await database.from("transactions").insert(payload).select(TRANSACTION_SELECT).single();
  if (error || !data) throw databaseUpstream("transaction_create_failed", "Could not create the transaction for this order.", error);
  return data;
}

/**
 * Creates a customer order with items and a transaction record.
 *
 * @param {import("../database/instance.js").DatabaseClient} client - Authenticated database client.
 * @param {object} input - Order payload including items.
 * @param {{customerId: string, profile?: object}} context - Auth/customer context.
 * @returns {Promise<{order: object, transaction: object}>} Created records.
 */
export async function createOrder(client, input, { customerId, profile }) {
  const database = resolveClient(client);
  const items = Array.isArray(input.items) ? input.items : [];
  if (!customerId) throw badRequest("invalid_order", "Customer account is required.");
  if (items.length === 0) throw badRequest("invalid_order", "Order must include at least one item.");

  const normalizedItems = items.map((item) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unit_price_cents ?? 0);
    if (!item.item_name || !String(item.item_name).trim()) throw badRequest("invalid_order", "Each order item must have a name.");
    if (!Number.isInteger(quantity) || quantity <= 0) throw badRequest("invalid_order", "Each order item quantity must be a positive integer.");
    if (!Number.isInteger(unitPrice) || unitPrice < 0) throw badRequest("invalid_order", "Each order item price must be a non-negative integer.");
    return {
      menu_item_id: item.menu_item_id || null,
      inventory_item_id: item.inventory_item_id || null,
      item_name: String(item.item_name).trim(),
      quantity,
      unit_price_cents: unitPrice,
      line_total_cents: quantity * unitPrice
    };
  });
  const subtotal = normalizedItems.reduce((sum, item) => sum + item.line_total_cents, 0);
  const paymentStatus = input.payment_status === "paid" ? "paid" : "unpaid";
  const orderPayload = {
    customer_id: customerId,
    status: input.status || "pending",
    payment_status: paymentStatus,
    subtotal_cents: subtotal,
    total_cents: subtotal,
    currency: input.currency || "PHP",
    notes: input.notes || null,
    customer_name: input.customer_name || profile?.full_name || null,
    customer_email: input.customer_email || profile?.email || null,
    customer_phone: input.customer_phone || profile?.phone || null
  };

  const { data: order, error } = await database.from("orders").insert(orderPayload).select(ORDER_SELECT).single();
  if (error || !order) throw databaseUpstream("order_create_failed", "Could not create the order.", error);

  const rows = normalizedItems.map((item) => ({ ...item, order_id: order.id }));
  const { error: itemsError } = await database.from("order_items").insert(rows);
  if (itemsError) {
    await database.from("orders").delete().eq("id", order.id);
    throw databaseUpstream("order_create_failed", "Could not create the order items.", itemsError);
  }

  const qrPayload = `ORDER:${order.order_number}|ID:${order.id}|TOTAL:${order.total_cents}`;
  const { data: orderWithQr, error: qrError } = await database
    .from("orders")
    .update({ qr_payload: qrPayload, updated_at: new Date().toISOString() })
    .eq("id", order.id)
    .select(ORDER_SELECT)
    .single();
  const finalOrder = !qrError && orderWithQr ? orderWithQr : { ...order, qr_payload: qrPayload };

  const [full] = await attachOrderItems(database, [finalOrder]);
  const transaction = await createTransactionForOrder(database, {
    order_id: finalOrder.id,
    order_number: finalOrder.order_number,
    customer_id: customerId,
    type: "payment",
    method: input.payment_method || null,
    status: paymentStatus === "paid" ? "completed" : "pending",
    amount_cents: finalOrder.total_cents,
    currency: finalOrder.currency || "PHP",
    notes: input.payment_reference ? `Reference: ${input.payment_reference}` : null
  });

  return { order: full, transaction };
}

/**
 * Updates an order (admin or owner with restrictions enforced by RLS/app).
 *
 * @param {import("../database/instance.js").DatabaseClient} client - Database client.
 * @param {string} id - Order id.
 * @param {object} input - Fields to update.
 * @returns {Promise<{order: object}>} Updated order.
 */
export async function updateOrder(client, id, input) {
  if (!id) throw badRequest("invalid_order", "Order id is required.");
  const database = resolveClient(client);
  const payload = { updated_at: new Date().toISOString() };
  for (const key of ["status", "payment_status", "notes", "customer_name", "customer_phone"]) {
    if (Object.prototype.hasOwnProperty.call(input, key)) payload[key] = input[key] ?? null;
  }
  if (Object.keys(payload).length === 1) throw badRequest("invalid_order", "No order fields to update.");

  const { data, error } = await database.from("orders").update(payload).eq("id", id).select(ORDER_SELECT).single();
  if (error || !data) {
    if (error?.code === "PGRST116" || !data) throw notFound("order_not_found", "Order not found.");
    throw databaseUpstream("order_update_failed", "Could not update the order.", error);
  }
  return getOrderById(database, id);
}

/**
 * Deletes an order (admin only by RLS typically).
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
