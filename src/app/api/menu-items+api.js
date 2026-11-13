import { authenticationInterceptor } from "../../interceptors/authentication-interceptor.js";
import { authorizationInterceptor } from "../../interceptors/authorization-interceptor.js";
import { errorInterceptor } from "../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../interceptors/method-interceptor.js";
import { withMiddleware } from "../../shared/middleware.js";
import { parseCreateMenuItemRequest } from "../../requests/menu-items.js";
import { createMenuItem, listMenuItems } from "../../repositories/menu-repository.js";
import { menuItemCreatedResponse, menuItemsResponse } from "../../responses/menu-items.js";
import { methodNotAllowed } from "../../shared/response.js";

/**
 * Menu items endpoint (list for signed-in users, create for admins).
 * @module app/api/menu-items+api
 */

const GET = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("GET"),
  authenticationInterceptor
)(async (context) => menuItemsResponse(await listMenuItems(context.locals.auth.supabase)));

const POST = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("POST"),
  authorizationInterceptor
)(async (context) => {
  const input = await parseCreateMenuItemRequest(context.request);
  return menuItemCreatedResponse(await createMenuItem(context.locals.auth.supabase, input));
});

export { GET, POST };
export function PUT() {
  return methodNotAllowed("GET, POST");
}
export function PATCH() {
  return methodNotAllowed("GET, POST");
}
export function DELETE() {
  return methodNotAllowed("GET, POST");
}
