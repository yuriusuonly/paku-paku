import { create } from "zustand";

/**
 * Global notification/snackbar store.
 * @module stores/notification-store
 */

let nextId = 1;

export const useNotificationStore = create((set, get) => ({
  items: [],

  /**
   * @param {{message: string, variant?: "error" | "success" | "info", duration?: number}} input
   * @returns {number} id
   */
  show: ({ message, variant = "info", duration = 4000 }) => {
    const id = nextId++;
    const item = { id, message, variant };
    set((s) => ({ items: [...s.items, item] }));
    if (duration > 0 && typeof setTimeout === "function") {
      setTimeout(() => {
        get().dismiss(id);
      }, duration);
    }
    return id;
  },

  showError: (message, duration = 5000) => get().show({ message, variant: "error", duration }),
  showSuccess: (message, duration = 3000) => get().show({ message, variant: "success", duration }),
  showInfo: (message, duration = 4000) => get().show({ message, variant: "info", duration }),

  dismiss: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  clear: () => set({ items: [] })
}));

/**
 * Helper to notify background failures from non-hook contexts.
 * @param {string} message
 */
export function notifyBackgroundError(message) {
  try {
    useNotificationStore.getState().showError(message || "Something went wrong in the background.");
  } catch {}
}
