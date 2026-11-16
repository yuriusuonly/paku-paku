import {
  hasOwn,
  readBoolean,
  readInteger,
  readNullableString,
  requireString,
  requireUpdateFields
} from "../../shared/validation/request.js";

/**
 * Menu item request validation shared by collection and by-id endpoints.
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
  const input = {};
  const code = "invalid_menu_item";

  if (!partial || hasOwn(body, "name")) {
    input.name = requireString(body.name, {
      code,
      message: "Menu item name is required."
    });
  }

  if (!partial || hasOwn(body, "description")) {
    input.description = readNullableString(body.description, {
      code,
      message: "Menu item description must be a string."
    });
  }

  if (!partial || hasOwn(body, "price_cents")) {
    input.price_cents = readInteger(body.price_cents, {
      code,
      message: "Menu item price_cents must be a non-negative integer.",
      min: 0
    });
  }

  if (!partial || hasOwn(body, "is_available")) {
    input.is_available = readBoolean(body.is_available, {
      code,
      message: "Menu item is_available must be a boolean."
    });
  }

  if (hasOwn(body, "is_best_seller")) {
    input.is_best_seller = readBoolean(body.is_best_seller, {
      code,
      message: "Menu item is_best_seller must be a boolean."
    });
  } else if (!partial) {
    input.is_best_seller = false;
  }

  if (!partial && hasOwn(body, "sort_order")) {
    input.sort_order = readInteger(body.sort_order, {
      code,
      message: "Menu item sort_order must be an integer."
    });
  } else if (partial && hasOwn(body, "sort_order") && body.sort_order !== "" && body.sort_order != null) {
    input.sort_order = readInteger(body.sort_order, {
      code,
      message: "Menu item sort_order must be an integer."
    });
  }

  if (partial) {
    requireUpdateFields(input, {
      code,
      message: "No menu item fields to update."
    });
  }

  return input;
}
