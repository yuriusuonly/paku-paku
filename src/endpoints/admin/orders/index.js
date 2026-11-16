import { authorizationInterceptor } from "../../../interceptors/authorization-interceptor.js";
import { errorInterceptor } from "../../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../../interceptors/method-interceptor.js";
import { withMiddleware } from "../../../shared/network/middleware.js";
import { jsonResponse, methodNotAllowed } from "../../../shared/network/response.js";
import { listOrders } from "../../../repositories/order-repository.js";

/**
 * Admin orders collection endpoint handlers.
 * @module endpoints/admin/orders/index
 */

export const GET = withMiddleware(logInterceptor, errorInterceptor, methodInterceptor("GET"), authorizationInterceptor)(
  async (context) => jsonResponse(await listOrders(context.locals.auth.database))
);

export function POST() { return methodNotAllowed("GET"); }
export function PUT() { return methodNotAllowed("GET"); }
export function PATCH() { return methodNotAllowed("GET"); }
export function DELETE() { return methodNotAllowed("GET"); }
