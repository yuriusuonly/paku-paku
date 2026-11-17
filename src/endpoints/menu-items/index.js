import { authenticationInterceptor } from "../../interceptors/authentication.interceptor.js";
import { authorizationInterceptor } from "../../interceptors/authorization.interceptor.js";
import { errorInterceptor } from "../../interceptors/error.interceptor.js";
import { logInterceptor } from "../../interceptors/log.interceptor.js";
import { methodInterceptor } from "../../interceptors/method.interceptor.js";
import { withMiddleware } from "../../shared/network/middleware.js";
import { readJsonBody } from "../../shared/network/request.js";
import { jsonResponse, methodNotAllowed } from "../../shared/network/response.js";
import { HTTP_STATUS } from "../../shared/constants/http.js";
import { createMenuItem, listMenuItems } from "../../repositories/menu.repository.js";
import { normalizeMenuItemInput } from "./validation.js";
import { requireObjectBody } from "../../shared/validation/request.js";

/**
 * Composed menu items collection endpoint handlers.
 * @module endpoints/menu-items/index
 */

async function parseCreateMenuItemRequest(request) {
  const body = requireObjectBody(
    await readJsonBody(request),
    "Expected a JSON object with menu item fields."
  );
  return normalizeMenuItemInput(body);
}

const menuItemsResponse = (data) => jsonResponse(data);
const menuItemCreatedResponse = (data) => jsonResponse(data, { status: HTTP_STATUS.CREATED });

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
