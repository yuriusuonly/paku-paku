import { errorInterceptor } from "../../interceptors/error-interceptor.js";
import { logInterceptor } from "../../interceptors/log-interceptor.js";
import { methodInterceptor } from "../../interceptors/method-interceptor.js";
import { badRequest } from "../../shared/errors/bad-request.js";
import { withMiddleware } from "../../shared/network/middleware.js";
import { readJsonBody } from "../../shared/network/request.js";
import { jsonResponse } from "../../shared/network/response.js";
import { recoverAccount } from "../../repositories/auth-repository.js";
import { normalizeEmail } from "../../shared/format/email.js";
import { isValidEmail } from "../../shared/validation/email.js";
import { requirePassword } from "../../shared/validation/password.js";
import { requireObjectBody } from "../../shared/validation/request.js";

/**
 * Composed account recovery endpoint handlers.
 * @module endpoints/recover/index
 */

async function parseRecoverRequest(request) {
  const body = requireObjectBody(
    await readJsonBody(request),
    "Expected a JSON object with email, recovery code, and new password."
  );

  const email = normalizeEmail(body.email);
  const recoveryCode = typeof body.recovery_code === "string" ? body.recovery_code.trim() : "";

  if (!isValidEmail(email) || !recoveryCode) {
    throw badRequest("invalid_recovery", "Enter a valid email and recovery code.");
  }

  const newPassword = requirePassword(body.new_password);

  return {
    email,
    recovery_code: recoveryCode,
    new_password: newPassword
  };
}

const route = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("POST")
)(async (context) => {
  const input = await parseRecoverRequest(context.request);
  return jsonResponse(await recoverAccount(input));
});

export const GET = route;
export const POST = route;
