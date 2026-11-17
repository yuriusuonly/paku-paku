import { create } from "zustand";
import { isSameRecord, upsertById } from "../shared/utils/records.js";
import { sortByOrder } from "../shared/utils/lists.js";
import { getErrorMessage } from "../shared/errors/message.js";
import { createMenuItem, deleteMenuItem, getMenuItems, updateMenuItem } from "../services/menu.js";
import { removeRealtimeChannel, subscribeToTableChanges } from "../services/realtime.js";
import { notifyBackgroundError } from "./notification.store.js";

/**
 * Menu items store with API-backed mutations and realtime database sync.
 * @module stores/menu.store
 */


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
   * @param {{background?: boolean}} [options] - Load options.
   * @returns {Promise<void>}
   */
  fetchItems: async ({ background = false } = {}) => {
    const hasItems = get().items.length > 0;
    const isRefresh = background || hasItems;
    set({
      loading: !isRefresh,
      syncing: isRefresh,
      error: null
    });

    try {
      const data = await getMenuItems();
      set({ items: sortByOrder(data.items || []), loading: false, syncing: false, error: null });
    } catch (error) {
      const message = getErrorMessage(error, "Could not load the menu. Please try again.");
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
   * @returns {void}
   */
  subscribe: () => {
    const state = get();
    if (state.channel) {
      return;
    }

    try {
      const channel = subscribeToTableChanges({
        channelName: "public:menu_items",
        table: "menu_items",
        onPayload: (payload) => {
          let changed = false;
          if (payload.eventType === "DELETE") {
            const id = payload.old?.id;
            if (id && get().items.some((item) => item.id === id)) {
              changed = true;
              set((s) => ({ items: s.items.filter((item) => item.id !== id), syncing: true, error: null }));
            }
          } else {
            const item = payload.new;
            if (item) {
              const current = get().items.find((entry) => entry.id === item.id);
              if (!isSameRecord(current, current ? { ...current, ...item } : item)) {
                changed = true;
                set((s) => ({ items: upsertById(s.items, item, { sort: sortByOrder }), syncing: true, error: null }));
              }
            }
          }

          if (changed) {
            setTimeout(() => set({ syncing: false }), 350);
          }
        },
        onStatus: (status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            const message = "Live menu updates are temporarily unavailable.";
            set({ subscribed: false, error: message });
            notifyBackgroundError(message);
          }
          if (status === "SUBSCRIBED") {
            set({ subscribed: true, error: null });
          }
        }
      });

      set({ channel, subscribed: false });
    } catch (error) {
      const message = getErrorMessage(error, "Could not connect to live menu updates.");
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
      await removeRealtimeChannel(channel);
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
        set((s) => ({ items: upsertById(s.items, data.item, { sort: sortByOrder }) }));
      }
      return data?.item;
    } catch (error) {
      const message = getErrorMessage(error, "Could not create the menu item. Please try again.");
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
        set((s) => ({ items: upsertById(s.items, data.item, { sort: sortByOrder }) }));
      }
      return data?.item;
    } catch (error) {
      const message = getErrorMessage(error, "Could not update the menu item. Please try again.");
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
      const message = getErrorMessage(error, "Could not delete the menu item. Please try again.");
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
      items: sortByOrder(typeof next === "function" ? next(s.items) : next)
    }));
  },

  /**
   * Clears menu state (e.g. on sign-out).
   *
   * @returns {void}
   */
  reset: () => set({ items: [], loading: false, syncing: false, error: null, subscribed: false, channel: null, lastToken: null })
}));
