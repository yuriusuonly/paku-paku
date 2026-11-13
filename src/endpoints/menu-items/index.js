import { authenticationInterceptor } from "../../interceptors/authentication-interceptor.js";
import { authorizationInterceptor } from "../../interceptors/authorization-interceptor.js";
import { errorInterceptor } from "../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../interceptors/method-interceptor.js";
import { badRequest } from "../../shared/errors/bad-request.js";
import { withMiddleware } from "../../shared/network/middleware.js";
import { readJsonBody } from "../../shared/network/request.js";
import { jsonResponse, methodNotAllowed } from "../../shared/network/response.js";
import { HTTP_STATUS } from "../../shared/constants/http.js";
import { createMenuItem, listMenuItems } from "../../repositories/menu-repository.js";

/**
 * Composed menu items collection endpoint handlers.
 * @module endpoints/menu-items/index
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

  if (!partial || Object.prototype.hasOwnProperty.call(body, "sort_order")) {
    const sortOrder = Number(body.sort_order);
    if (!Number.isInteger(sortOrder)) {
      throw badRequest("invalid_menu_item", "Menu item sort_order must be an integer.");
    }
    input.sort_order = sortOrder;
  }

  if (partial && Object.keys(input).length === 0) {
    throw badRequest("invalid_menu_item", "No menu item fields to update.");
  }

  return input;
}

async function parseCreateMenuItemRequest(request) {
  const body = await readJsonBody(request);
  if (!body) {
    throw badRequest("invalid_body", "Expected a JSON object with menu item fields.");
  }
  return normalizeMenuItemInput(body, { partial: false });
}

function menuItemsResponse(data) {
  return jsonResponse(data);
}

function menuItemCreatedResponse(data) {
  return jsonResponse(data, { status: HTTP_STATUS.CREATED });
}

export const GET = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("GET"),
  authenticationInterceptor
)(async (context) => menuItemsResponse(await listMenuItems(context.locals.auth.database)));

export const POST = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("POST"),
  authorizationInterceptor
)(async (context) => {
  const input = await parseCreateMenuItemRequest(context.request);
  return menuItemCreatedResponse(await createMenuItem(context.locals.auth.database, input));
});

export function PUT() {
  return methodNotAllowed("GET, POST");
}

export function PATCH() {
  return methodNotAllowed("GET, POST");
}

export function DELETE() {
  return methodNotAllowed("GET, POST");
}
