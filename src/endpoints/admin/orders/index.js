import { authorizationInterceptor } from "../../../interceptors/authorization.interceptor.js";
import { errorInterceptor } from "../../../interceptors/error.interceptor.js";
import { logInterceptor } from "../../../interceptors/log.interceptor.js";
import { methodInterceptor } from "../../../interceptors/method.interceptor.js";
import { withMiddleware } from "../../../shared/network/middleware.js";
import { readJsonBody } from "../../../shared/network/request.js";
import { jsonResponse, methodNotAllowed } from "../../../shared/network/response.js";
import { HTTP_STATUS } from "../../../shared/constants/http.js";
import { createOrder, listOrders } from "../../../repositories/order.repository.js";
import { requireObjectBody } from "../../../shared/validation/request.js";

/**
 * Admin orders collection endpoint handlers.
 * @module endpoints/admin/orders/index
 */

export const GET = withMiddleware(logInterceptor, errorInterceptor, methodInterceptor("GET"), authorizationInterceptor)(
  async (context) => jsonResponse(await listOrders(context.locals.auth.database))
);

export const POST = withMiddleware(logInterceptor, errorInterceptor, methodInterceptor("POST"), authorizationInterceptor)(
  async (context) => {
    const body = requireObjectBody(
      await readJsonBody(context.request),
      "Expected a JSON object with order fields."
    );
    return jsonResponse(await createOrder(context.locals.auth.database, body), { status: HTTP_STATUS.CREATED });
  }
);

export function PUT() { return methodNotAllowed("GET, POST"); }
export function PATCH() { return methodNotAllowed("GET, POST"); }
export function DELETE() { return methodNotAllowed("GET, POST"); }
