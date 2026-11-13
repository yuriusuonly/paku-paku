import { errorResponse, jsonResponse, methodNotAllowed } from "../../shared/api.js";
import { createSupabaseServerClient } from "../../shared/supabase-server.js";

/**
 * Public menu endpoint (`src/app/api/menu-items+api.js`): replaces the old
 * `supabase:check` script with a real Expo Router API route. RLS limits the
 * result to available menu items.
 * @module app/api/menu-items+api
 */

/**
 * GET handler for `/api/menu-items`.
 *
 * @returns {Promise<Response>} Available menu items ordered for the storefront.
 */
export async function GET() {
  let supabase;
  try {
    supabase = createSupabaseServerClient();
  } catch {
    return errorResponse(503, "supabase_unconfigured", "Supabase is not configured for server routes.");
  }

  const { data, error } = await supabase
    .from("menu_items")
    .select("id, name, description, price_cents, is_available, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    return errorResponse(502, "menu_unavailable", "Could not load the menu.");
  }

  return jsonResponse({
    items: data
  });
}

/**
 * Rejects unsupported methods.
 *
 * @returns {Response} `405 Method Not Allowed`.
 */
export function POST() {
  return methodNotAllowed("GET");
}
