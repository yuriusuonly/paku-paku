import {
  hasOwn,
  readBoolean,
  readInteger,
  readNullableString,
  requireString,
  requireUpdateFields
} from "../../../shared/validation/request.js";

/**
 * Inventory item request validation shared by collection and by-id endpoints.
 * @module endpoints/admin/inventory/validation
 */

/**
 * Normalizes and validates inventory item input.
 *
 * @param {Record<string, any>} body
 * @param {{partial?: boolean}} [options]
 * @returns {Record<string, any>}
 */
export function normalizeInventoryInput(body, { partial = false } = {}) {
  const input = {};
  const code = "invalid_inventory_item";

  if (!partial || hasOwn(body, "name")) {
    input.name = requireString(body.name, {
      code,
      message: "Inventory item name is required."
    });
  }

  if (!partial || hasOwn(body, "sku")) {
    input.sku = readNullableString(body.sku, {
      code,
      message: "Inventory SKU must be a string."
    });
  }

  if (!partial || hasOwn(body, "description")) {
    input.description = readNullableString(body.description, {
      code,
      message: "Inventory description must be a string."
    });
  }

  if (!partial || hasOwn(body, "quantity")) {
    input.quantity = readInteger(body.quantity, {
      code,
      message: "Inventory quantity must be a non-negative integer.",
      min: 0,
      defaultValue: partial ? undefined : 0
    });
  }

  if (!partial || hasOwn(body, "unit")) {
    input.unit = readNullableString(body.unit, {
      code,
      message: "Inventory unit must be a string."
    });
  }

  if (!partial || hasOwn(body, "reorder_level")) {
    input.reorder_level = readInteger(body.reorder_level, {
      code,
      message: "Inventory reorder level must be a non-negative integer.",
      min: 0,
      defaultValue: partial ? undefined : 0
    });
  }

  if (!partial || hasOwn(body, "unit_cost_cents")) {
    input.unit_cost_cents = readInteger(body.unit_cost_cents, {
      code,
      message: "Inventory unit cost must be a non-negative integer (cents).",
      min: 0,
      defaultValue: partial ? undefined : 0
    });
  }

  if (!partial || hasOwn(body, "menu_item_id")) {
    input.menu_item_id = readNullableString(body.menu_item_id, {
      code,
      message: "Inventory menu_item_id must be a string."
    });
  }

  if (!partial || hasOwn(body, "is_active")) {
    input.is_active = readBoolean(body.is_active, {
      code,
      message: "Inventory is_active must be a boolean."
    });
  }

  if (partial) {
    requireUpdateFields(input, {
      code,
      message: "No inventory item fields to update."
    });
  }

  return input;
}
