/**
 * Storefront menu section rules.
 * @module domain/menu/sections
 */

/**
 * Sort-order ranges used to classify menu items.
 * Drinks < 100, main dishes >= 200.
 * @type {{drinkMax: number, foodMin: number}}
 */
export const MENU_SORT_RANGES = Object.freeze({
  drinkMax: 100,
  foodMin: 200
});

/**
 * Groups visible items into storefront sections.
 *
 * @param {object[]} items - Available menu items.
 * @returns {Array<{key: string, title: string, items: object[]}>} Non-empty menu sections.
 */
export function getMenuSections(items) {
  const visible = (items || [])
    .filter((item) => item?.is_available !== false)
    .sort((a, b) => Number(a?.sort_order ?? 0) - Number(b?.sort_order ?? 0));
  const sortOrder = (item) => Number(item?.sort_order ?? 0);

  const beverageItems = visible.filter((item) => sortOrder(item) < MENU_SORT_RANGES.drinkMax);
  const foodItems = visible.filter((item) => sortOrder(item) >= MENU_SORT_RANGES.foodMin);

  return [
    { key: "food", title: "Main dishes", items: foodItems },
    { key: "beverage", title: "Side drinks", items: beverageItems }
  ].filter((section) => section.items.length > 0);
}
