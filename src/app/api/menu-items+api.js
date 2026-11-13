import { listMenuItems } from "../../services/server/menu-service.js";
import { ok, withErrorHandling, withMethods, withMiddleware } from "../../interceptors/index.js";

/**
 * Public menu endpoint.
 * @module app/api/menu-items+api
 */

const route = withMiddleware(
  withErrorHandling,
  withMethods("GET")
)(async () => ok(await listMenuItems()));

export { route as GET, route as POST };
