import { authorizationInterceptor } from "../../../interceptors/authorization-interceptor.js";
import { errorInterceptor } from "../../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../../interceptors/method-interceptor.js";
import { badRequest } from "../../../shared/errors/bad-request.js";
import { withMiddleware } from "../../../shared/network/middleware.js";
import { readJsonBody } from "../../../shared/network/request.js";
import { jsonResponse, methodNotAllowed } from "../../../shared/network/response.js";
import { deleteInventoryItem, updateInventoryItem } from "../../../repositories/inventory-repository.js";

/**
 * Composed admin inventory item endpoint handlers (by id).
 * @module endpoints/admin/inventory/[id]
 */

function normalizeInventoryInput(body) {
  const input = {};

  if (Object.prototype.hasOwnProperty.call(body, "name")) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) throw badRequest("invalid_inventory_item", "Inventory item name is required.");
    input.name = name;
  }

  if (Object.prototype.hasOwnProperty.call(body, "sku")) {
    if (body.sku == null || body.sku === "") input.sku = null;
    else if (typeof body.sku === "string") input.sku = body.sku.trim() || null;
    else throw badRequest("invalid_inventory_item", "Inventory SKU must be a string.");
  }

  if (Object.prototype.hasOwnProperty.call(body, "description")) {
    if (body.description == null || body.description === "") input.description = null;
    else if (typeof body.description === "string") input.description = body.description.trim() || null;
    else throw badRequest("invalid_inventory_item", "Inventory description must be a string.");
  }

  if (Object.prototype.hasOwnProperty.call(body, "quantity")) {
    const quantity = Number(body.quantity);
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw badRequest("invalid_inventory_item", "Inventory quantity must be a non-negative integer.");
    }
    input.quantity = quantity;
  }

  if (Object.prototype.hasOwnProperty.call(body, "unit")) {
    if (body.unit == null || body.unit === "") input.unit = null;
    else if (typeof body.unit === "string") input.unit = body.unit.trim() || null;
    else throw badRequest("invalid_inventory_item", "Inventory unit must be a string.");
  }

  if (Object.prototype.hasOwnProperty.call(body, "reorder_level")) {
    const reorderLevel = Number(body.reorder_level);
    if (!Number.isInteger(reorderLevel) || reorderLevel < 0) {
      throw badRequest("invalid_inventory_item", "Inventory reorder level must be a non-negative integer.");
    }
    input.reorder_level = reorderLevel;
  }

  if (Object.prototype.hasOwnProperty.call(body, "unit_cost_cents")) {
    const cost = Number(body.unit_cost_cents);
    if (!Number.isInteger(cost) || cost < 0) {
      throw badRequest("invalid_inventory_item", "Inventory unit cost must be a non-negative integer (cents).");
    }
    input.unit_cost_cents = cost;
  }

  if (Object.prototype.hasOwnProperty.call(body, "menu_item_id")) {
    if (body.menu_item_id == null || body.menu_item_id === "") input.menu_item_id = null;
    else if (typeof body.menu_item_id === "string") input.menu_item_id = body.menu_item_id.trim();
    else throw badRequest("invalid_inventory_item", "Inventory menu_item_id must be a string.");
  }

  if (Object.prototype.hasOwnProperty.call(body, "is_active")) {
    if (typeof body.is_active !== "boolean") {
      throw badRequest("invalid_inventory_item", "Inventory is_active must be a boolean.");
    }
    input.is_active = body.is_active;
  }

  if (Object.keys(input).length === 0) {
    throw badRequest("invalid_inventory_item", "No inventory item fields to update.");
  }

  return input;
}

function getId(context) {
  const fromParams = context?.params?.id;
  if (typeof fromParams === "string" && fromParams.trim()) return fromParams.trim();
  const segments = (context?.url?.pathname || "").split("/").filter(Boolean);
  return String(segments[segments.length - 1] || "").trim();
}

async function parseUpdateRequest(request) {
  const body = await readJsonBody(request);
  if (!body) throw badRequest("invalid_body", "Expected a JSON object with inventory item fields.");
  return normalizeInventoryInput(body);
}

export const PATCH = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("PATCH"),
  authorizationInterceptor
)(async (context) => {
  const input = await parseUpdateRequest(context.request);
  return jsonResponse(await updateInventoryItem(context.locals.auth.database, getId(context), input));
});

export const DELETE = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("DELETE"),
  authorizationInterceptor
)(async (context) => jsonResponse(await deleteInventoryItem(context.locals.auth.database, getId(context))));

export function GET() { return methodNotAllowed("PATCH, DELETE"); }
export function POST() { return methodNotAllowed("PATCH, DELETE"); }
export function PUT() { return methodNotAllowed("PATCH, DELETE"); }
