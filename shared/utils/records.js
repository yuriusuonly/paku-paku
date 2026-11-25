/**
 * Record comparison and update helpers.
 * @module shared/utils/records
 */

/**
 * Performs a shallow equality check for plain record-like objects.
 * @param {Record<string, any>|null|undefined} a
 * @param {Record<string, any>|null|undefined} b
 * @returns {boolean}
 */
export function isSameRecord(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => Object.is(a[key], b[key]));
}

/**
 * Inserts or merges a record by `id` without mutating the input list.
 *
 * @template {Record<string, any>} T
 * @param {T[]} items - Current records.
 * @param {T} item - Record to insert or merge.
 * @param {{sort?: (records: T[]) => T[], compare?: (a: T, b: T) => boolean}} [options] - Update options.
 * @returns {T[]} Updated records.
 */
export function upsertById(items, item, { sort, compare = isSameRecord } = {}) {
  if (!item || item.id == null) {
    return sort ? sort([...items]) : items;
  }

  const index = items.findIndex((entry) => entry?.id === item.id);
  if (index === -1) {
    const next = [...items, item];
    return sort ? sort(next) : next;
  }

  const merged = { ...items[index], ...item };
  if (compare(items[index], merged)) {
    return items;
  }

  const next = [...items];
  next[index] = merged;
  return sort ? sort(next) : next;
}
