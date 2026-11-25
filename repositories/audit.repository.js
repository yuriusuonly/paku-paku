import { databaseUnconfigured } from "../shared/errors/database-unconfigured.js";
import { databaseUpstream } from "../shared/errors/database-upstream.js";
import { createDatabaseClient } from "../database/instance.js";

/**
 * Audit log data access (API to database contracts).
 * @module repositories/audit.repository
 */

const AUDIT_SELECT =
  "id, table_name, record_id, action, actor_id, actor_email, before_data, after_data, created_at";

/**
 * Lists recent audit log entries.
 *
 * @param {import("../database/instance.js").DatabaseClient} [client] - Database client.
 * @param {{limit?: number}} [options] - List options.
 * @returns {Promise<{logs: object[]}>} Audit logs payload.
 */
export async function listAuditLogs(client, { limit = 100 } = {}) {
  let database = client;
  if (!database) {
    try {
      database = createDatabaseClient();
    } catch (error) {
      throw databaseUnconfigured("Database is not configured for server routes.", error);
    }
  }

  const { data, error } = await database
    .from("audit_logs")
    .select(AUDIT_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw databaseUpstream("audit_logs_unavailable", "Could not load audit logs.", error);
  }

  return { logs: data || [] };
}
