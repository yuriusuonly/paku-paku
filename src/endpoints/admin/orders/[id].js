import { authorizationInterceptor } from "../../../interceptors/authorization-interceptor.js";
import { errorInterceptor } from "../../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../../interceptors/method-interceptor.js";
import { badRequest } from "../../../shared/errors/bad-request.js";
import { withMiddleware } from "../../../shared/network/middleware.js";
import { readJsonBody } from "../../../shared/network/request.js";
import { jsonResponse, methodNotAllowed } from "../../../shared/network/response.js";
import { deleteOrder, getOrderById, updateOrder } from "../../../repositories/order-repository.js";

/**
 * Admin order endpoint handlers (by id).
 * @module endpoints/admin/orders/[id]
 */

function getId(context) {
  const id = context?.params?.id || (context?.url?.pathname || "").split("/").filter(Boolean).pop();
  return typeof id === "string" ? id.trim() : "";
}

export const GET = withMiddleware(logInterceptor, errorInterceptor, methodInterceptor("GET"), authorizationInterceptor)(
  async (context) => jsonResponse(await getOrderById(context.locals.auth.database, getId(context)))
);

export const PATCH = withMiddleware(logInterceptor, errorInterceptor, methodInterceptor("PATCH"), authorizationInterceptor)(
  async (context) => {
    const body = await readJsonBody(context.request);
    if (!body) throw badRequest("invalid_body", "Expected a JSON object with order updates.");
    return jsonResponse(await updateOrder(context.locals.auth.database, getId(context), body));
  }
);

export const DELETE = withMiddleware(logInterceptor, errorInterceptor, methodInterceptor("DELETE"), authorizationInterceptor)(
  async (context) => jsonResponse(await deleteOrder(context.locals.auth.database, getId(context)))
);

export function POST() { return methodNotAllowed("GET, PATCH, DELETE"); }
export function PUT() { return methodNotAllowed("GET, PATCH, DELETE"); }
