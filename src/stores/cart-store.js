import { create } from "zustand";

/**
 * Client-side shopping cart store.
 * @module stores/cart-store
 */

const STORAGE_PREFIX = "paku-paku.cart";

function storageKey(userId) {
  return `${STORAGE_PREFIX}:${userId || "guest"}`;
}

function readCart(userId) {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCart(userId, items) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(items));
  } catch {}
}

function lineKey(item) {
  return `${item.menu_item_id || item.item_name}`;
}

/**
 * @type {import("zustand").UseBoundStore<import("zustand").StoreApi<any>>}
 */
export const useCartStore = create((set, get) => ({
  userId: null,
  items: [],

  /** @param {string | null} userId */
  hydrate: (userId) => {
    set({ userId: userId || null, items: readCart(userId) });
  },

  /** @param {object} item */
  addItem: (item) => {
    const key = lineKey(item);
    set((state) => {
      const existing = state.items.find((entry) => lineKey(entry) === key);
      let next;
      if (existing) {
        next = state.items.map((entry) =>
          lineKey(entry) === key ? { ...entry, quantity: Number(entry.quantity || 0) + Number(item.quantity || 1) } : entry
        );
      } else {
        next = [...state.items, { ...item, quantity: Number(item.quantity || 1) }];
      }
      writeCart(state.userId, next);
      return { items: next };
    });
  },

  /** @param {string} key @param {number} quantity */
  setQuantity: (key, quantity) => {
    set((state) => {
      const qty = Math.max(0, Number(quantity || 0));
      const next = qty === 0
        ? state.items.filter((entry) => lineKey(entry) !== key)
        : state.items.map((entry) => (lineKey(entry) === key ? { ...entry, quantity: qty } : entry));
      writeCart(state.userId, next);
      return { items: next };
    });
  },

  /** @param {string} key */
  removeItem: (key) => {
    set((state) => {
      const next = state.items.filter((entry) => lineKey(entry) !== key);
      writeCart(state.userId, next);
      return { items: next };
    });
  },

  clear: () => {
    set((state) => {
      writeCart(state.userId, []);
      return { items: [] };
    });
  },

  getTotalCents: () => get().items.reduce((sum, item) => sum + Number(item.unit_price_cents || 0) * Number(item.quantity || 0), 0),
  getCount: () => get().items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
}));
