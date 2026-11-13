import { badGateway, serviceUnavailable } from "../shared/errors.js";
import { createSupabaseServerClient } from "../shared/supabase.js";

/**
 * Menu data access (API to database contracts).
 * @module repositories/menu-repository
 */

/**
 * Lists available menu items ordered for display.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} [client] - Authenticated Supabase client.
 * @returns {Promise<{items: object[]}>} Menu payload.
 * @throws {import("../shared/errors.js").AppError} When menu data cannot be loaded.
 */
export async function listMenuItems(client) {
  let supabase = client;
  if (!supabase) {
    try {
      supabase = createSupabaseServerClient();
    } catch (error) {
      throw serviceUnavailable(
        "supabase_unconfigured",
        "Supabase is not configured for server routes.",
        error
      );
    }
  }

  const { data, error } = await supabase
    .from("menu_items")
    .select("id, name, description, price_cents, is_available, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    throw badGateway("menu_unavailable", "Could not load the menu.", error);
  }

  return { items: data };
}
