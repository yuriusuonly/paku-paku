import {
  errorInterceptor,
  logInterceptor,
  methodInterceptor,
  withMiddleware
} from "../../interceptors/index.js";
import { listMenuItems } from "../../repositories/menu-repository.js";
import { ok } from "../../responses/index.js";

/**
 * Public menu endpoint.
 * @module app/api/menu-items+api
 */

const route = withMiddleware(
  logInterceptor,
  errorInterceptor,
  methodInterceptor("GET")
)(async () => ok(await listMenuItems()));

export { route as GET, route as POST };
