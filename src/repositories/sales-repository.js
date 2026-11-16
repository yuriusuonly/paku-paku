import { badRequest } from "../shared/errors/bad-request.js";
import { notFound } from "../shared/errors/not-found.js";
import { databaseUnconfigured } from "../shared/errors/database-unconfigured.js";
import { databaseUpstream } from "../shared/errors/database-upstream.js";
import { createDatabaseClient } from "../database/instance.js";

/**
 * Sales data access (API to database contracts).
 * @module repositories/sales-repository
 */

const SALE_SELECT =
  "id, sale_number, status, payment_method, customer_name, notes, subtotal_cents, total_cents, created_by, created_at, updated_at";
const SALE_ITEM_SELECT =
  "id, sale_id, menu_item_id, inventory_item_id, item_name, quantity, unit_price_cents, line_total_cents, created_at";

/**
 * @param {import("../database/instance.js").DatabaseClient} [client] - Database client.
 * @returns {import("../database/instance.js").DatabaseClient} Resolved client.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} When unavailable.
 */
function resolveClient(client) {
  if (client) return client;
  try {
    return createDatabaseClient();
  } catch (error) {
    throw databaseUnconfigured("Database is not configured for server routes.", error);
  }
}

/**
 * Attaches sale items to sales records.
 *
 * @param {import("../database/instance.js").DatabaseClient} database - Database client.
 * @param {object[]} sales - Sales rows.
 * @returns {Promise<object[]>} Sales with `items`.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} On failure.
 */
async function attachSaleItems(database, sales) {
  if (!sales.length) return [];
  const ids = sales.map((sale) => sale.id);
  const { data, error } = await database
    .from("sale_items")
    .select(SALE_ITEM_SELECT)
    .in("sale_id", ids)
    .order("created_at", { ascending: true });

  if (error) {
    throw databaseUpstream("sales_unavailable", "Could not load sale items.", error);
  }

  const grouped = new Map();
  for (const item of data || []) {
    const list = grouped.get(item.sale_id) || [];
    list.push(item);
    grouped.set(item.sale_id, list);
  }

  return sales.map((sale) => ({ ...sale, items: grouped.get(sale.id) || [] }));
}

/**
 * Lists sales with line items.
 *
 * @param {import("../database/instance.js").DatabaseClient} [client] - Admin database client.
 * @returns {Promise<{sales: object[]}>} Sales payload.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} On failure.
 */
export async function listSales(client) {
  const database = resolveClient(client);
  const { data, error } = await database
    .from("sales")
    .select(SALE_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    throw databaseUpstream("sales_unavailable", "Could not load sales.", error);
  }

  const sales = await attachSaleItems(database, data || []);
  return { sales };
}

/**
 * Gets a sale by id with line items.
 *
 * @param {import("../database/instance.js").DatabaseClient} client - Admin database client.
 * @param {string} id - Sale id.
 * @returns {Promise<{sale: object}>} Sale payload.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} On failure.
 */
export async function getSaleById(client, id) {
  if (!id) throw badRequest("invalid_sale", "Sale id is required.");
  const database = resolveClient(client);
  const { data, error } = await database
    .from("sales")
    .select(SALE_SELECT)
    .eq("id", id)
    .single();

  if (error || !data) {
    if (error?.code === "PGRST116" || !data) {
      throw notFound("sale_not_found", "Sale not found.");
    }
    throw databaseUpstream("sales_unavailable", "Could not load the sale.", error);
  }

  const [sale] = await attachSaleItems(database, [data]);
  return { sale };
}

/**
 * Applies inventory decrements for completed sale items.
 *
 * @param {import("../database/instance.js").DatabaseClient} database - Admin database client.
 * @param {object[]} items - Normalized sale items.
 * @returns {Promise<void>}
 */
async function applyInventoryDecrements(database, items) {
  for (const item of items) {
    if (!item.inventory_item_id || !Number.isInteger(item.quantity) || item.quantity <= 0) continue;

    const { data: current, error: readError } = await database
      .from("inventory_items")
      .select("id, quantity")
      .eq("id", item.inventory_item_id)
      .single();

    if (readError || !current) continue;
    const nextQuantity = Math.max(0, (current.quantity || 0) - item.quantity);
    await database
      .from("inventory_items")
      .update({ quantity: nextQuantity, updated_at: new Date().toISOString() })
      .eq("id", current.id);
  }
}

/**
 * Creates a sale with line items.
 *
 * @param {import("../database/instance.js").DatabaseClient} client - Admin database client.
 * @param {object} input - Sale fields including `items`.
 * @param {{userId?: string | null}} [options] - Creation options.
 * @returns {Promise<{sale: object}>} Created sale payload.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} On failure.
 */
export async function createSale(client, input, { userId = null } = {}) {
  const database = resolveClient(client);
  const { items = [], ...saleInput } = input;

  const { data: sale, error } = await database
    .from("sales")
    .insert({ ...saleInput, created_by: userId || saleInput.created_by || null })
    .select(SALE_SELECT)
    .single();

  if (error || !sale) {
    throw databaseUpstream("sale_create_failed", "Could not create the sale.", error);
  }

  if (items.length > 0) {
    const rows = items.map((item) => ({ ...item, sale_id: sale.id }));
    const { error: itemsError } = await database.from("sale_items").insert(rows);
    if (itemsError) {
      await database.from("sales").delete().eq("id", sale.id);
      throw databaseUpstream("sale_create_failed", "Could not create the sale items.", itemsError);
    }

    if ((sale.status || "completed") === "completed") {
      await applyInventoryDecrements(database, rows);
    }
  }

  return getSaleById(database, sale.id);
}

/**
 * Updates a sale and replaces its line items.
 *
 * @param {import("../database/instance.js").DatabaseClient} client - Admin database client.
 * @param {string} id - Sale id.
 * @param {object} input - Sale fields including optional `items`.
 * @returns {Promise<{sale: object}>} Updated sale payload.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} On failure.
 */
export async function updateSale(client, id, input) {
  if (!id) throw badRequest("invalid_sale", "Sale id is required.");
  const database = resolveClient(client);
  const { items, ...saleInput } = input || {};
  const updatePayload = Object.keys(saleInput).length
    ? { ...saleInput, updated_at: new Date().toISOString() }
    : { updated_at: new Date().toISOString() };

  const { data: sale, error } = await database
    .from("sales")
    .update(updatePayload)
    .eq("id", id)
    .select(SALE_SELECT)
    .single();

  if (error || !sale) {
    if (error?.code === "PGRST116" || !sale) {
      throw notFound("sale_not_found", "Sale not found.");
    }
    throw databaseUpstream("sale_update_failed", "Could not update the sale.", error);
  }

  if (Array.isArray(items)) {
    const { error: deleteError } = await database.from("sale_items").delete().eq("sale_id", id);
    if (deleteError) {
      throw databaseUpstream("sale_update_failed", "Could not update the sale items.", deleteError);
    }
    if (items.length > 0) {
      const rows = items.map((item) => ({ ...item, sale_id: id }));
      const { error: insertError } = await database.from("sale_items").insert(rows);
      if (insertError) {
        throw databaseUpstream("sale_update_failed", "Could not update the sale items.", insertError);
      }
    }
  }

  return getSaleById(database, id);
}

/**
 * Deletes a sale by id.
 *
 * @param {import("../database/instance.js").DatabaseClient} client - Admin database client.
 * @param {string} id - Sale id.
 * @returns {Promise<{id: string}>} Deleted id.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} On failure.
 */
export async function deleteSale(client, id) {
  if (!id) throw badRequest("invalid_sale", "Sale id is required.");
  const database = resolveClient(client);
  const { data, error } = await database
    .from("sales")
    .delete()
    .eq("id", id)
    .select("id")
    .single();

  if (error || !data) {
    if (error?.code === "PGRST116" || !data) {
      throw notFound("sale_not_found", "Sale not found.");
    }
    throw databaseUpstream("sale_delete_failed", "Could not delete the sale.", error);
  }

  return { id: data.id };
}
