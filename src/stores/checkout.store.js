import { create } from "zustand";

/**
 * Store for the most recently placed customer order.
 * @module stores/checkout.store
 */

/**
 * Local storage key for the confirmation order.
 *
 * @type {string}
 */
const STORAGE_KEY = "paku-paku.checkout";

/**
 * Reads the persisted confirmation order.
 *
 * @returns {object | null} Stored order or `null`.
 */
function readStoredOrder() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Persists or clears the confirmation order.
 *
 * @param {object | null} order - Order to persist, or `null` to clear.
 * @returns {void}
 */
function writeStoredOrder(order) {
  if (typeof window === "undefined") return;
  try {
    if (order) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage can be unavailable (private mode/quota); keep in-memory state.
  }
}

/**
 * Zustand store hook for the placed-order confirmation.
 */
export const useCheckoutStore = create((set, get) => ({
  order: null,
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    set({ order: readStoredOrder(), hydrated: true });
  },

  setOrder: (order) => {
    writeStoredOrder(order);
    set({ order, hydrated: true });
  },

  clear: () => {
    writeStoredOrder(null);
    set({ order: null, hydrated: true });
  }
}));
