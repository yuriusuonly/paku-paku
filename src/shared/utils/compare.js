/**
 * Generic comparison helpers.
 * @module shared/utils/compare
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
