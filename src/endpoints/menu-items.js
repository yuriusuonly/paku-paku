import { authenticationInterceptor } from "../interceptors/authentication-interceptor.js";
import { authorizationInterceptor } from "../interceptors/authorization-interceptor.js";
import { errorInterceptor } from "../interceptors/error-interceptor.js";
import { logInterceptor } from "../interceptors/log-interceptor.js";
import { methodInterceptor } from "../interceptors/method-interceptor.js";
import { withMiddleware } from "../network/middleware.js";
import { parseCreateMenuItemRequest } from "../requests/menu-items.js";
import { createMenuItem, listMenuItems } from "../repositories/menu-repository.js";
import { menuItemCreatedResponse, menuItemsResponse } from "../responses/menu-items.js";
import { methodNotAllowed } from "../network/response.js";

/**
 * Composed menu items collection endpoint handlers.
 * @module endpoints/menu-items
 */

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
