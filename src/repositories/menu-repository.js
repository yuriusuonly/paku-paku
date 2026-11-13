import { badRequest } from "../shared/errors/bad-request.js";
import { notFound } from "../shared/errors/not-found.js";
import { databaseUnconfigured } from "../shared/errors/database-unconfigured.js";
import { databaseUpstream } from "../shared/errors/database-upstream.js";
import { createDatabaseClient } from "../database/instance.js";

/**
 * Menu data access (API to database contracts).
 * @module repositories/menu-repository
 */

const MENU_ITEM_SELECT = "id, name, description, price_cents, is_available, sort_order, created_at, updated_at";

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
 * Lists menu items ordered for display.
 *
 * @param {import("../database/instance.js").DatabaseClient} [client] - Authenticated database client.
 * @returns {Promise<{items: object[]}>} Menu payload.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} When menu data cannot be loaded.
 */
export async function listMenuItems(client) {
  const database = resolveClient(client);
  const { data, error } = await database
    .from("menu_items")
    .select(MENU_ITEM_SELECT)
    .order("sort_order", { ascending: true });

  if (error) {
    throw databaseUpstream("menu_unavailable", "Could not load the menu.", error);
  }

  return { items: data || [] };
}

/**
 * Creates a menu item.
 *
 * @param {import("../database/instance.js").DatabaseClient} client - Authenticated/admin database client.
 * @param {object} input - Menu item fields.
 * @returns {Promise<{item: object}>} Created item.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} When creation fails.
 */
export async function createMenuItem(client, input) {
  const database = resolveClient(client);
  const payload = { ...input };

  if (payload.sort_order == null) {
    const { data: lastItem, error: sortError } = await database
      .from("menu_items")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sortError) {
      throw databaseUpstream("menu_item_create_failed", "Could not determine the next sort order.", sortError);
    }

    payload.sort_order = Number.isInteger(lastItem?.sort_order) ? lastItem.sort_order + 1 : 0;
  }

  const { data, error } = await database
    .from("menu_items")
    .insert(payload)
    .select(MENU_ITEM_SELECT)
    .single();

  if (error) {
    throw databaseUpstream("menu_item_create_failed", "Could not create the menu item.", error);
  }

  return { item: data };
}

/**
 * Updates a menu item by id.
 *
 * @param {import("../database/instance.js").DatabaseClient} client - Authenticated/admin database client.
 * @param {string} id - Menu item id.
 * @param {object} input - Fields to update.
 * @returns {Promise<{item: object}>} Updated item.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} When update fails.
 */
export async function updateMenuItem(client, id, input) {
  if (!id) {
    throw badRequest("invalid_menu_item", "Menu item id is required.");
  }
  if (!input || Object.keys(input).length === 0) {
    throw badRequest("invalid_menu_item", "No menu item fields to update.");
  }

  const database = resolveClient(client);
  const { data, error } = await database
    .from("menu_items")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(MENU_ITEM_SELECT)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw notFound("menu_item_not_found", "Menu item not found.");
    }
    throw databaseUpstream("menu_item_update_failed", "Could not update the menu item.", error);
  }

  return { item: data };
}

/**
 * Deletes a menu item by id.
 *
 * @param {import("../database/instance.js").DatabaseClient} client - Authenticated/admin database client.
 * @param {string} id - Menu item id.
 * @returns {Promise<{id: string}>} Deleted id.
 * @throws {Error & {status?: number, code?: string, expose?: boolean, isAppError?: boolean}} When deletion fails.
 */
export async function deleteMenuItem(client, id) {
  if (!id) {
    throw badRequest("invalid_menu_item", "Menu item id is required.");
  }

  const database = resolveClient(client);
  const { data, error } = await database
    .from("menu_items")
    .delete()
    .eq("id", id)
    .select("id")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw notFound("menu_item_not_found", "Menu item not found.");
    }
    throw databaseUpstream("menu_item_delete_failed", "Could not delete the menu item.", error);
  }

  return { id: data.id };
}
