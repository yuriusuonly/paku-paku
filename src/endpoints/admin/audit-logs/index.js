import { z } from "zod";
import { authorizationInterceptor } from "../../../interceptors/authorization.interceptor.js";
import { errorInterceptor } from "../../../interceptors/error.interceptor.js";
import { logInterceptor } from "../../../interceptors/log.interceptor.js";
import { methodInterceptor } from "../../../interceptors/method.interceptor.js";
import { withMiddleware } from "../../../shared/network/middleware.js";
import { jsonResponse, methodNotAllowed } from "../../../shared/network/response.js";
import { parseWithSchema } from "../../../shared/validation/request.js";
import { listAuditLogs } from "../../../repositories/audit.repository.js";

/**
 * Admin audit log endpoint handlers.
 * @module endpoints/admin/audit-logs/index
 */

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(100)
});

export const GET = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("GET"),
  authorizationInterceptor
)(async (context) => {
  const query = parseWithSchema(
    querySchema,
    { limit: context.url.searchParams.get("limit") ?? undefined },
    { code: "invalid_query", message: "Invalid audit log query." }
  );
  return jsonResponse(await listAuditLogs(context.locals.auth.database, { limit: query.limit }));
});

export function POST() { return methodNotAllowed("GET"); }
export function PUT() { return methodNotAllowed("GET"); }
export function PATCH() { return methodNotAllowed("GET"); }
export function DELETE() { return methodNotAllowed("GET"); }
