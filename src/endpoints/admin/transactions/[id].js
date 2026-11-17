import { authorizationInterceptor } from "../../../interceptors/authorization.interceptor.js";
import { errorInterceptor } from "../../../interceptors/error.interceptor.js";
import { logInterceptor } from "../../../interceptors/log.interceptor.js";
import { methodInterceptor } from "../../../interceptors/method.interceptor.js";
import { withMiddleware } from "../../../shared/network/middleware.js";
import { readJsonBody } from "../../../shared/network/request.js";
import { jsonResponse, methodNotAllowed } from "../../../shared/network/response.js";
import { deleteTransaction, getTransactionById, updateTransaction } from "../../../repositories/transaction.repository.js";
import { readRouteId, requireObjectBody } from "../../../shared/validation/request.js";

/**
 * Admin transaction endpoint handlers (by id).
 * @module endpoints/admin/transactions/[id]
 */

export const GET = withMiddleware(logInterceptor, errorInterceptor, methodInterceptor("GET"), authorizationInterceptor)(
  async (context) => jsonResponse(await getTransactionById(context.locals.auth.database, readRouteId(context)))
);

export const PATCH = withMiddleware(logInterceptor, errorInterceptor, methodInterceptor("PATCH"), authorizationInterceptor)(
  async (context) => {
    const body = requireObjectBody(
      await readJsonBody(context.request),
      "Expected a JSON object with transaction updates."
    );
    return jsonResponse(await updateTransaction(context.locals.auth.database, readRouteId(context), body));
  }
);

export const DELETE = withMiddleware(logInterceptor, errorInterceptor, methodInterceptor("DELETE"), authorizationInterceptor)(
  async (context) => jsonResponse(await deleteTransaction(context.locals.auth.database, readRouteId(context)))
);

export function POST() { return methodNotAllowed("GET, PATCH, DELETE"); }
export function PUT() { return methodNotAllowed("GET, PATCH, DELETE"); }
