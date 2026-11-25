/**
 * Small list sorting helpers.
 * @module helpers/lists
 */

/**
 * Sorts records by `sort_order`, then by name.
 * @template {Record<string, any>} T
 * @param {T[]} items - Records to sort.
 * @returns {T[]} Sorted copy.
 */
export function sortByOrder(items) {
  return [...items].sort((a, b) => {
    const order = Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0);
    if (order !== 0) return order;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
}

/**
 * Sorts records by a string field.
 * @template {Record<string, any>} T
 * @param {T[]} items - Records to sort.
 * @param {string} key - Field name.
 * @returns {T[]} Sorted copy.
 */
export function sortByString(items, key) {
  return [...items].sort((a, b) => String(a[key] || "").localeCompare(String(b[key] || "")));
}

/**
 * Sorts records by `created_at`, newest first.
 * @template {Record<string, any>} T
 * @param {T[]} items - Records to sort.
 * @returns {T[]} Sorted copy.
 */
export function sortByCreatedDesc(items) {
  return [...items].sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  );
}
