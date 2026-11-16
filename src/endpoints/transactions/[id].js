import { authenticationInterceptor } from "../../interceptors/authentication-interceptor.js";
import { bodyInterceptor } from "../../interceptors/body-interceptor.js";
import { errorInterceptor } from "../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../interceptors/method-interceptor.js";
import { badRequest } from "../../shared/errors/bad-request.js";
import { withMiddleware } from "../../shared/network/middleware.js";
import { jsonResponse, methodNotAllowed } from "../../shared/network/response.js";
import { getTransactionById, updateTransaction } from "../../repositories/transaction-repository.js";

/**
 * Customer transaction endpoint handlers (by id).
 * @module endpoints/transactions/[id]
 */

function getId(context) {
  const id = context?.params?.id || (context?.url?.pathname || "").split("/").filter(Boolean).pop();
  return typeof id === "string" ? id.trim() : "";
}

export const GET = withMiddleware(logInterceptor, errorInterceptor, methodInterceptor("GET"), authenticationInterceptor)(
  async (context) => jsonResponse(await getTransactionById(context.locals.auth.database, getId(context)))
);

export const PATCH = withMiddleware(logInterceptor, errorInterceptor, methodInterceptor("PATCH"), authenticationInterceptor, bodyInterceptor)(
  async (context) => {
    const body = context.locals.body?.json;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw badRequest("invalid_body", "Expected a JSON object with transaction updates.");
    }
    return jsonResponse(await updateTransaction(context.locals.auth.database, getId(context), body));
  }
);

export function POST() { return methodNotAllowed("GET, PATCH"); }
export function PUT() { return methodNotAllowed("GET, PATCH"); }
export function DELETE() { return methodNotAllowed("GET, PATCH"); }
