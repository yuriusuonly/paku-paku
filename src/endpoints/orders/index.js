import { authenticationInterceptor } from "../../interceptors/authentication-interceptor.js";
import { errorInterceptor } from "../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../interceptors/method-interceptor.js";
import { badRequest } from "../../shared/errors/bad-request.js";
import { withMiddleware } from "../../shared/network/middleware.js";
import { readJsonBody } from "../../shared/network/request.js";
import { jsonResponse, methodNotAllowed } from "../../shared/network/response.js";
import { HTTP_STATUS } from "../../shared/constants/http.js";
import { createOrder, listOrders } from "../../repositories/order-repository.js";

/**
 * Customer orders endpoint handlers.
 * @module endpoints/orders/index
 */

async function parseCreateRequest(request) {
  const body = await readJsonBody(request);
  if (!body) throw badRequest("invalid_body", "Expected a JSON object with order details.");
  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw badRequest("invalid_order", "Order must include at least one item.");
  }
  return body;
}

export const GET = withMiddleware(logInterceptor, errorInterceptor, methodInterceptor("GET"), authenticationInterceptor)(
  async (context) => jsonResponse(await listOrders(context.locals.auth.database))
);

export const POST = withMiddleware(logInterceptor, errorInterceptor, methodInterceptor("POST"), authenticationInterceptor)(
  async (context) => {
    const input = await parseCreateRequest(context.request);
    const data = await createOrder(context.locals.auth.database, input, {
      customerId: context.locals.auth.profile.id,
      profile: context.locals.auth.profile
    });
    return jsonResponse(data, { status: HTTP_STATUS.CREATED });
  }
);

export function PUT() { return methodNotAllowed("GET, POST"); }
export function PATCH() { return methodNotAllowed("GET, POST"); }
export function DELETE() { return methodNotAllowed("GET, POST"); }
