import { jsonResponse } from "../network/response.js";

/**
 * Response shaping for `GET /api/health`.
 * @module responses/health
 */

/**
 * Builds the health check response.
 *
 * @returns {Response} JSON health response.
 */
export function healthResponse() {
  return jsonResponse({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
}
