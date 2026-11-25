import { badRequest } from "../errors/bad-request.js";
import { notFound } from "../errors/not-found.js";
import { databaseUnconfigured } from "../errors/database-unconfigured.js";
import { databaseUpstream } from "../errors/database-upstream.js";
import { createDatabaseClient } from "../database/instance.js";

/**
 * Item data access (API to database contracts).
 * @module repositories/item.repository
 */

const ITEM_SELECT = "id, name, description, price_cents, is_available, is_best_seller, sort_order, created_at, updated_at";

/**
 * @param {import("../database/instance.js").DatabaseClient} [client] - Database client.
 * @returns {import("../database/instance.js").DatabaseClient} Resolved client.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} When the database is unavailable.
 */
function resolveClient(client) {
  if (client) {
    return client;
  }
  try {
    return createDatabaseClient();
  } catch (error) {
    throw databaseUnconfigured("Database is not configured for server routes.", error);
  }
}

/**
 * Lists items ordered for display.
 *
 * @param {import("../database/instance.js").DatabaseClient} [client] - Authenticated database client.
 * @returns {Promise<{items: object[]}>} Items payload.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} When item data cannot be loaded.
 */
export async function listItems(client) {
  const database = resolveClient(client);
  const { data, error } = await database
    .from("items")
    .select(ITEM_SELECT)
    .order("sort_order", { ascending: true });

  if (error) {
    throw databaseUpstream("items_unavailable", "Could not load items.", error);
  }

  return { items: data || [] };
}

/**
 * Creates an item.
 *
 * @param {import("../database/instance.js").DatabaseClient} client - Authenticated/admin database client.
 * @param {object} input - Item fields.
 * @returns {Promise<{item: object}>} Created item.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} When creation fails.
 */
export async function createItem(client, input) {
  const database = resolveClient(client);
  const payload = { ...input };

  if (payload.sort_order == null) {
    const { data: lastItem, error: sortError } = await database
      .from("items")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sortError) {
      throw databaseUpstream("item_create_failed", "Could not determine the next sort order.", sortError);
    }

    payload.sort_order = Number.isInteger(lastItem?.sort_order) ? lastItem.sort_order + 1 : 0;
  }

  const { data, error } = await database
    .from("items")
    .insert(payload)
    .select(ITEM_SELECT)
    .single();

  if (error) {
    throw databaseUpstream("item_create_failed", "Could not create the item.", error);
  }

  return { item: data };
}

/**
 * Updates a item by id.
 *
 * @param {import("../database/instance.js").DatabaseClient} client - Authenticated/admin database client.
 * @param {string} id - Item id.
 * @param {object} input - Fields to update.
 * @returns {Promise<{item: object}>} Updated item.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} When update fails.
 */
export async function updateItem(client, id, input) {
  if (!id) {
    throw badRequest("invalid_item", "Item id is required.");
  }
  if (!input || Object.keys(input).length === 0) {
    throw badRequest("invalid_item", "No item fields to update.");
  }

  const database = resolveClient(client);
  const { data, error } = await database
    .from("items")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(ITEM_SELECT)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw notFound("item_not_found", "Item not found.");
    }
    throw databaseUpstream("item_update_failed", "Could not update the item.", error);
  }

  return { item: data };
}

/**
 * Deletes a item by id.
 *
 * @param {import("../database/instance.js").DatabaseClient} client - Authenticated/admin database client.
 * @param {string} id - Item id.
 * @returns {Promise<{id: string}>} Deleted id.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} When deletion fails.
 */
export async function deleteItem(client, id) {
  if (!id) {
    throw badRequest("invalid_item", "Item id is required.");
  }

  const database = resolveClient(client);
  const { data, error } = await database
    .from("items")
    .delete()
    .eq("id", id)
    .select("id")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw notFound("item_not_found", "Item not found.");
    }
    throw databaseUpstream("item_delete_failed", "Could not delete the item.", error);
  }

  return { id: data.id };
}
