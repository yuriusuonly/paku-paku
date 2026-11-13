import { authorizationInterceptor } from "../../../interceptors/authorization-interceptor.js";
import { errorInterceptor } from "../../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../../interceptors/method-interceptor.js";
import { withMiddleware } from "../../../network/middleware.js";
import { parseUpdateMenuItemRequest } from "../../../requests/menu-items.js";
import { deleteMenuItem, updateMenuItem } from "../../../repositories/menu-repository.js";
import { menuItemDeletedResponse, menuItemResponse } from "../../../responses/menu-items.js";
import { methodNotAllowed } from "../../../network/response.js";

/**
 * Menu item mutation endpoint (admin-only).
 * @module app/api/menu-items/[id]+api
 */

const PATCH = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("PATCH"),
  authorizationInterceptor
)(async (context) => {
  const input = await parseUpdateMenuItemRequest(context.request);
  return menuItemResponse(
    await updateMenuItem(context.locals.auth.database, context.params.id, input)
  );
});

const DELETE = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("DELETE"),
  authorizationInterceptor
)(async (context) =>
  menuItemDeletedResponse(
    await deleteMenuItem(context.locals.auth.database, context.params.id)
  )
);

export { PATCH, DELETE };
export function GET() {
  return methodNotAllowed("PATCH, DELETE");
}
export function POST() {
  return methodNotAllowed("PATCH, DELETE");
}
export function PUT() {
  return methodNotAllowed("PATCH, DELETE");
}
