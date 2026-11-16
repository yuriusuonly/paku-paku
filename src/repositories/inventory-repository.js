import { badRequest } from "../shared/errors/bad-request.js";
import { notFound } from "../shared/errors/not-found.js";
import { databaseUnconfigured } from "../shared/errors/database-unconfigured.js";
import { databaseUpstream } from "../shared/errors/database-upstream.js";
import { createDatabaseClient } from "../database/instance.js";

/**
 * Inventory data access (API to database contracts).
 * @module repositories/inventory-repository
 */

const INVENTORY_SELECT =
  "id, name, sku, description, quantity, unit, reorder_level, unit_cost_cents, menu_item_id, is_active, created_at, updated_at";

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
 * Lists inventory items.
 *
 * @param {import("../database/instance.js").DatabaseClient} [client] - Admin database client.
 * @returns {Promise<{items: object[]}>} Inventory payload.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} On failure.
 */
export async function listInventoryItems(client) {
  const database = resolveClient(client);
  const { data, error } = await database
    .from("inventory_items")
    .select(INVENTORY_SELECT)
    .order("name", { ascending: true });

  if (error) {
    throw databaseUpstream("inventory_unavailable", "Could not load inventory items.", error);
  }

  return { items: data || [] };
}

/**
 * Creates an inventory item.
 *
 * @param {import("../database/instance.js").DatabaseClient} client - Admin database client.
 * @param {object} input - Inventory fields.
 * @returns {Promise<{item: object}>} Created item.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} On failure.
 */
export async function createInventoryItem(client, input) {
  const database = resolveClient(client);
  const { data, error } = await database
    .from("inventory_items")
    .insert(input)
    .select(INVENTORY_SELECT)
    .single();

  if (error) {
    throw databaseUpstream("inventory_item_create_failed", "Could not create the inventory item.", error);
  }

  return { item: data };
}

/**
 * Updates an inventory item by id.
 *
 * @param {import("../database/instance.js").DatabaseClient} client - Admin database client.
 * @param {string} id - Inventory item id.
 * @param {object} input - Fields to update.
 * @returns {Promise<{item: object}>} Updated item.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} On failure.
 */
export async function updateInventoryItem(client, id, input) {
  if (!id) throw badRequest("invalid_inventory_item", "Inventory item id is required.");
  if (!input || Object.keys(input).length === 0) {
    throw badRequest("invalid_inventory_item", "No inventory item fields to update.");
  }

  const database = resolveClient(client);
  const { data, error } = await database
    .from("inventory_items")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(INVENTORY_SELECT)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw notFound("inventory_item_not_found", "Inventory item not found.");
    }
    throw databaseUpstream("inventory_item_update_failed", "Could not update the inventory item.", error);
  }

  return { item: data };
}

/**
 * Deletes an inventory item by id.
 *
 * @param {import("../database/instance.js").DatabaseClient} client - Admin database client.
 * @param {string} id - Inventory item id.
 * @returns {Promise<{id: string}>} Deleted id.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} On failure.
 */
export async function deleteInventoryItem(client, id) {
  if (!id) throw badRequest("invalid_inventory_item", "Inventory item id is required.");

  const database = resolveClient(client);
  const { data, error } = await database
    .from("inventory_items")
    .delete()
    .eq("id", id)
    .select("id")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw notFound("inventory_item_not_found", "Inventory item not found.");
    }
    throw databaseUpstream("inventory_item_delete_failed", "Could not delete the inventory item.", error);
  }

  return { id: data.id };
}

/**
 * Adjusts inventory quantity by delta (clamped at 0).
 *
 * @param {import("../database/instance.js").DatabaseClient} client - Admin database client.
 * @param {string} id - Inventory item id.
 * @param {number} delta - Quantity delta (negative to decrement).
 * @returns {Promise<{item: object}>} Updated item.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} On failure.
 */
export async function adjustInventoryQuantity(client, id, delta) {
  if (!id) throw badRequest("invalid_inventory_item", "Inventory item id is required.");
  if (!Number.isInteger(delta)) {
    throw badRequest("invalid_inventory_item", "Inventory adjustment must be an integer.");
  }

  const database = resolveClient(client);
  const { data: current, error: readError } = await database
    .from("inventory_items")
    .select("id, quantity")
    .eq("id", id)
    .single();

  if (readError || !current) {
    if (readError?.code === "PGRST116" || !current) {
      throw notFound("inventory_item_not_found", "Inventory item not found.");
    }
    throw databaseUpstream("inventory_item_update_failed", "Could not read the inventory item.", readError);
  }

  const nextQuantity = Math.max(0, (current.quantity || 0) + delta);
  return updateInventoryItem(database, id, { quantity: nextQuantity });
}
