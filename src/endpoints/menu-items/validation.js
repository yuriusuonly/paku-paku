import { parseWithSchema, requireUpdateFields } from "../../shared/validation/request.js";
import { menuItemCreateSchema, menuItemPartialSchema } from "../../domain/menu-items/schema.js";

/**
 * Menu item endpoint validation backed by domain schemas.
 * @module endpoints/menu-items/validation
 */

/**
 * Normalizes and validates menu item input.
 *
 * @param {Record<string, any>} body
 * @param {{partial?: boolean}} [options]
 * @returns {Record<string, any>}
 */
export function normalizeMenuItemInput(body, { partial = false } = {}) {
  const input = parseWithSchema(partial ? menuItemPartialSchema : menuItemCreateSchema, body, {
    code: "invalid_menu_item",
    message: partial ? "Invalid menu item fields." : "Invalid menu item."
  });

  if (partial) {
    requireUpdateFields(input, {
      code: "invalid_menu_item",
      message: "No menu item fields to update."
    });
  }

  return input;
}
