import { authorizationInterceptor } from "../../interceptors/authorization-interceptor.js";
import { errorInterceptor } from "../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../interceptors/method-interceptor.js";
import { badRequest } from "../../shared/errors/bad-request.js";
import { withMiddleware } from "../../shared/network/middleware.js";
import { readJsonBody } from "../../shared/network/request.js";
import { jsonResponse, methodNotAllowed } from "../../shared/network/response.js";
import { deleteMenuItem, updateMenuItem } from "../../repositories/menu-repository.js";

/**
 * Composed menu item endpoint handlers (by id).
 * @module endpoints/menu-items/[id]
 */

function normalizeMenuItemInput(body, { partial }) {
  const input = {};

  if (!partial || Object.prototype.hasOwnProperty.call(body, "name")) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      throw badRequest("invalid_menu_item", "Menu item name is required.");
    }
    input.name = name;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(body, "description")) {
    if (body.description == null || body.description === "") {
      input.description = null;
    } else if (typeof body.description === "string") {
      input.description = body.description.trim();
    } else {
      throw badRequest("invalid_menu_item", "Menu item description must be a string.");
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(body, "price_cents")) {
    const price = Number(body.price_cents);
    if (!Number.isInteger(price) || price < 0) {
      throw badRequest("invalid_menu_item", "Menu item price_cents must be a non-negative integer.");
    }
    input.price_cents = price;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(body, "is_available")) {
    if (typeof body.is_available !== "boolean") {
      throw badRequest("invalid_menu_item", "Menu item is_available must be a boolean.");
    }
    input.is_available = body.is_available;
  }

  if (Object.prototype.hasOwnProperty.call(body, "sort_order")) {
    const sortOrderValue = body.sort_order;
    if (!(sortOrderValue === "" || sortOrderValue == null)) {
      const sortOrder = Number(sortOrderValue);
      if (!Number.isInteger(sortOrder)) {
        throw badRequest("invalid_menu_item", "Menu item sort_order must be an integer.");
      }
      input.sort_order = sortOrder;
    }
  }

  if (partial && Object.keys(input).length === 0) {
    throw badRequest("invalid_menu_item", "No menu item fields to update.");
  }

  return input;
}

async function parseUpdateMenuItemRequest(request) {
  const body = await readJsonBody(request);
  if (!body) {
    throw badRequest("invalid_body", "Expected a JSON object with menu item fields.");
  }
  return normalizeMenuItemInput(body, { partial: true });
}

function menuItemResponse(data) {
  return jsonResponse(data);
}

function menuItemDeletedResponse(data) {
  return jsonResponse(data);
}

function getMenuItemId(context) {
  const fromParams = context?.params?.id;
  if (typeof fromParams === "string" && fromParams.trim()) {
    return fromParams.trim();
  }

  const pathname = context?.url?.pathname || "";
  const segments = pathname.split("/").filter(Boolean);
  const id = segments[segments.length - 1];
  return typeof id === "string" ? id.trim() : "";
}

export const PATCH = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("PATCH"),
  authorizationInterceptor
)(async (context) => {
  const input = await parseUpdateMenuItemRequest(context.request);
  return menuItemResponse(
    await updateMenuItem(context.locals.auth.database, getMenuItemId(context), input)
  );
});

export const DELETE = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("DELETE"),
  authorizationInterceptor
)(async (context) =>
  menuItemDeletedResponse(
    await deleteMenuItem(context.locals.auth.database, getMenuItemId(context))
  )
);

export function GET() {
  return methodNotAllowed("PATCH, DELETE");
}

export function POST() {
  return methodNotAllowed("PATCH, DELETE");
}

export function PUT() {
  return methodNotAllowed("PATCH, DELETE");
}
