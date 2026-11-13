import { create } from "zustand";
import { createMenuItem, deleteMenuItem, getMenuItems, updateMenuItem } from "../services/menu.js";
import { getSupabase } from "../shared/supabase.js";

/**
 * Menu items store with API-backed mutations and realtime database sync.
 * @module stores/menu-store
 */

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
  error: null,
  subscribed: false,
  channel: null,
  lastToken: null,

  /**
   * Loads menu items from the API into the store.
   *
   * @param {string} token - Access token.
   * @returns {Promise<void>}
   */
  fetchItems: async (token) => {
    if (!token) {
      set({ items: [], loading: false, error: null });
      return;
    }

    set({ loading: true, error: null, lastToken: token });
    try {
      const data = await getMenuItems(token);
      set({ items: sortItems(data.items || []), loading: false, error: null });
    } catch (error) {
      set({
        loading: false,
        error: error && typeof error.message === "string" ? error.message : "Could not load the menu."
      });
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
      const supabase = getSupabase();
      const channel = supabase
        .channel("public:menu_items")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "menu_items" },
          (payload) => {
            if (payload.eventType === "DELETE") {
              const id = payload.old?.id;
              if (!id) return;
              set((s) => ({ items: s.items.filter((item) => item.id !== id) }));
              return;
            }

            const item = payload.new;
            if (!item) return;
            set((s) => ({ items: upsertItem(s.items, item) }));
          }
        )
        .subscribe();

      set({ channel, subscribed: true, lastToken: token || state.lastToken });
    } catch (error) {
      set({
        subscribed: false,
        error: error && typeof error.message === "string" ? error.message : "Could not subscribe to menu updates."
      });
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
      await getSupabase().removeChannel(channel);
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
    const data = await createMenuItem(token, input);
    if (data?.item) {
      set((s) => ({ items: upsertItem(s.items, data.item) }));
    }
    return data?.item;
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
    const data = await updateMenuItem(token, id, input);
    if (data?.item) {
      set((s) => ({ items: upsertItem(s.items, data.item) }));
    }
    return data?.item;
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
    await deleteMenuItem(token, id);
    set((s) => ({ items: s.items.filter((item) => item.id !== id) }));
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
  reset: () => set({ items: [], loading: false, error: null })
}));
