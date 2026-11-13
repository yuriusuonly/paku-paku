import { create } from "zustand";
import { createMenuItem, deleteMenuItem, getMenuItems, updateMenuItem } from "../services/menu.js";
import { getDatabaseClient } from "../database/instance.js";
import { notifyBackgroundError } from "./notification-store.js";

/**
 * Menu items store with API-backed mutations and realtime database sync.
 * @module stores/menu-store
 */

const friendlyError = (error, fallback) =>
  error && typeof error.message === "string" && error.message.trim()
    ? error.message
    : fallback;

/**
 * @param {object[]} items - Menu items.
 * @returns {object[]} Sorted items.
 */
function sortItems(items) {
  return [...items].sort((a, b) => {
    const order = (a.sort_order ?? 0) - (b.sort_order ?? 0);
    if (order !== 0) return order;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
}

/**
 * @param {object[]} items - Current items.
 * @param {object} item - Item to upsert.
 * @returns {object[]} Updated items.
 */
function upsertItem(items, item) {
  const index = items.findIndex((entry) => entry.id === item.id);
  if (index === -1) {
    return sortItems([...items, item]);
  }
  const next = [...items];
  next[index] = { ...next[index], ...item };
  return sortItems(next);
}

/**
 * Zustand store hook for menu items state and bidirectional sync actions.
 */
export const useMenuStore = create((set, get) => ({
  items: [],
  loading: false,
  syncing: false,
  error: null,
  subscribed: false,
  channel: null,
  lastToken: null,

  clearError: () => set({ error: null }),

  /**
   * Loads menu items from the API into the store.
   *
   * @param {string} token - Access token.
   * @param {{background?: boolean}} [options] - Load options.
   * @returns {Promise<void>}
   */
  fetchItems: async (token, { background = false } = {}) => {
    if (!token) {
      set({ items: [], loading: false, syncing: false, error: null });
      return;
    }

    const hasItems = get().items.length > 0;
    const isRefresh = background || hasItems;
    set({
      loading: !isRefresh,
      syncing: isRefresh,
      error: null,
      lastToken: token
    });

    try {
      const data = await getMenuItems(token);
      set({ items: sortItems(data.items || []), loading: false, syncing: false, error: null });
    } catch (error) {
      const message = friendlyError(error, "Could not load the menu. Please try again.");
      set({ loading: false, syncing: false, error: message });
      if (background || hasItems) {
        notifyBackgroundError(message);
      }
      throw error;
    }
  },

  /**
   * Subscribes to realtime menu item changes for DB -> store sync.
   *
   * @param {string} token - Access token (used to refresh after auth changes).
   * @returns {void}
   */
  subscribe: (token) => {
    const state = get();
    if (state.channel) {
      return;
    }

    try {
      const database = getDatabaseClient();
      const channel = database
        .channel("public:menu_items")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "menu_items" },
          (payload) => {
            // Reflect reactive data changes with a brief syncing state.
            set({ syncing: true, error: null });

            if (payload.eventType === "DELETE") {
              const id = payload.old?.id;
              if (id) {
                set((s) => ({ items: s.items.filter((item) => item.id !== id) }));
              }
            } else {
              const item = payload.new;
              if (item) {
                set((s) => ({ items: upsertItem(s.items, item) }));
              }
            }

            setTimeout(() => set({ syncing: false }), 350);
          }
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            const message = "Live menu updates are temporarily unavailable.";
            set({ subscribed: false, error: message });
            notifyBackgroundError(message);
          }
          if (status === "SUBSCRIBED") {
            set({ subscribed: true, error: null });
          }
        });

      set({ channel, subscribed: false, lastToken: token || state.lastToken });
    } catch (error) {
      const message = friendlyError(error, "Could not connect to live menu updates.");
      set({ subscribed: false, error: message });
      notifyBackgroundError(message);
    }
  },

  /**
   * Unsubscribes from realtime menu item changes.
   *
   * @returns {Promise<void>}
   */
  unsubscribe: async () => {
    const { channel } = get();
    if (!channel) {
      set({ subscribed: false, channel: null });
      return;
    }
    try {
      await getDatabaseClient().removeChannel(channel);
    } catch (error) {
      notifyBackgroundError("Could not disconnect live menu updates cleanly.");
    } finally {
      set({ subscribed: false, channel: null });
    }
  },

  /**
   * Creates a menu item (persists to DB; store syncs via response/realtime).
   *
   * @param {string} token - Access token.
   * @param {object} input - Menu item fields.
   * @returns {Promise<object>} Created item.
   */
  createItem: async (token, input) => {
    set({ syncing: true, error: null });
    try {
      const data = await createMenuItem(token, input);
      if (data?.item) {
        set((s) => ({ items: upsertItem(s.items, data.item) }));
      }
      return data?.item;
    } catch (error) {
      const message = friendlyError(error, "Could not create the menu item. Please try again.");
      set({ error: message });
      throw error;
    } finally {
      set({ syncing: false });
    }
  },

  /**
   * Updates a menu item (persists to DB; store syncs via response/realtime).
   *
   * @param {string} token - Access token.
   * @param {string} id - Menu item id.
   * @param {object} input - Fields to update.
   * @returns {Promise<object>} Updated item.
   */
  updateItem: async (token, id, input) => {
    set({ syncing: true, error: null });
    try {
      const data = await updateMenuItem(token, id, input);
      if (data?.item) {
        set((s) => ({ items: upsertItem(s.items, data.item) }));
      }
      return data?.item;
    } catch (error) {
      const message = friendlyError(error, "Could not update the menu item. Please try again.");
      set({ error: message });
      throw error;
    } finally {
      set({ syncing: false });
    }
  },

  /**
   * Saves an item by creating or updating based on presence of id.
   *
   * @param {string} token - Access token.
   * @param {object} input - Menu item fields, optionally including id.
   * @returns {Promise<object>} Saved item.
   */
  saveItem: async (token, input) => {
    if (input?.id) {
      const { id, ...rest } = input;
      return get().updateItem(token, id, rest);
    }
    return get().createItem(token, input);
  },

  /**
   * Deletes a menu item (persists to DB; store syncs via response/realtime).
   *
   * @param {string} token - Access token.
   * @param {string} id - Menu item id.
   * @returns {Promise<void>}
   */
  removeItem: async (token, id) => {
    set({ syncing: true, error: null });
    try {
      await deleteMenuItem(token, id);
      set((s) => ({ items: s.items.filter((item) => item.id !== id) }));
    } catch (error) {
      const message = friendlyError(error, "Could not delete the menu item. Please try again.");
      set({ error: message });
      throw error;
    } finally {
      set({ syncing: false });
    }
  },

  /**
   * Replaces local menu items state directly.
   *
   * @param {object[] | ((items: object[]) => object[])} next - Items or updater.
   * @returns {void}
   */
  setItems: (next) => {
    set((s) => ({
      items: sortItems(typeof next === "function" ? next(s.items) : next)
    }));
  },

  /**
   * Clears menu state (e.g. on sign-out).
   *
   * @returns {void}
   */
  reset: () => set({ items: [], loading: false, syncing: false, error: null, subscribed: false, channel: null, lastToken: null })
}));
