/**
 * Date formatting helpers.
 * @module shared/format/date
 */

/**
 * Formats a timestamp for audit table display.
 * @param {string|number|Date|null|undefined} value
 * @returns {string}
 */
export function formatAuditTimestamp(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}
