import { authorizationInterceptor } from "../../../interceptors/authorization.interceptor.js";
import { errorInterceptor } from "../../../interceptors/error.interceptor.js";
import { logInterceptor } from "../../../interceptors/log.interceptor.js";
import { methodInterceptor } from "../../../interceptors/method.interceptor.js";
import { withMiddleware } from "../../../network/middleware.js";
import { readJsonBody } from "../../../network/request.js";
import { jsonResponse, methodNotAllowed } from "../../../network/response.js";
import { deleteOrder, getOrderById, updateOrder } from "../../../repositories/order.repository.js";
import { readRouteId, requireObjectBody } from "../../../validation/request.js";

/**
 * Admin order endpoint handlers (by id).
 * @module endpoints/admin/orders/[id]
 */

export const GET = withMiddleware(logInterceptor, errorInterceptor, methodInterceptor("GET"), authorizationInterceptor)(
  async (context) => jsonResponse(await getOrderById(context.locals.auth.database, readRouteId(context)))
);

export const PATCH = withMiddleware(logInterceptor, errorInterceptor, methodInterceptor("PATCH"), authorizationInterceptor)(
  async (context) => {
    const body = requireObjectBody(
      await readJsonBody(context.request),
      "Expected a JSON object with order updates."
    );
    return jsonResponse(await updateOrder(context.locals.auth.database, readRouteId(context), body));
  }
);

export const DELETE = withMiddleware(logInterceptor, errorInterceptor, methodInterceptor("DELETE"), authorizationInterceptor)(
  async (context) => jsonResponse(await deleteOrder(context.locals.auth.database, readRouteId(context)))
);

export function POST() { return methodNotAllowed("GET, PATCH, DELETE"); }
export function PUT() { return methodNotAllowed("GET, PATCH, DELETE"); }
