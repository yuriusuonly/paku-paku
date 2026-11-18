/**
 * Audit log presentation helpers.
 * @module domain/audit/summary
 */

/**
 * Returns the primary label for an audited record.
 *
 * @param {{table_name?: string, before_data?: object|null, after_data?: object|null}} log - Audit log.
 * @returns {string}
 */
export function getAuditSummary(log) {
  const after = log?.after_data || {};
  const before = log?.before_data || {};

  if (log?.table_name === "orders") {
    return String(after.order_number || before.order_number || "Order");
  }
  if (log?.table_name === "profiles") {
    return String(after.email || before.email || "Profile");
  }
  if (log?.table_name === "order_items") {
    return String(after.item_name || before.item_name || "Order item");
  }
  return String(after.name || before.name || "Item");
}

/**
 * Returns a display label for the actor that made the change.
 *
 * @param {{actor_email?: string|null}} log - Audit log.
 * @returns {string}
 */
export function getAuditActor(log) {
  return String(log?.actor_email || "kiosk");
}
