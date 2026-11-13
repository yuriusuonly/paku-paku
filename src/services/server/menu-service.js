import { createSupabaseServerClient } from "../../shared/supabase-server.js";

/**
 * Menu service: read operations for storefront menu data.
 * @module services/menu-service
 */

/**
 * Lists available menu items ordered for display.
 *
 * @returns {Promise<{ok: true, data: {items: object[]}} | {ok: false, status: number, code: string, message: string}>} Service result.
 */
export async function listMenuItems() {
  let supabase;
  try {
    supabase = createSupabaseServerClient();
  } catch {
    return {
      ok: false,
      status: 503,
      code: "supabase_unconfigured",
      message: "Supabase is not configured for server routes."
    };
  }

  const { data, error } = await supabase
    .from("menu_items")
    .select("id, name, description, price_cents, is_available, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    return {
      ok: false,
      status: 502,
      code: "menu_unavailable",
      message: "Could not load the menu."
    };
  }

  return {
    ok: true,
    data: {
      items: data
    }
  };
}
