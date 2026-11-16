import { create } from "zustand";
import { isSameRecord } from "../shared/utils/compare.js";
import { createInventoryItem, deleteInventoryItem, getInventoryItems, updateInventoryItem } from "../services/inventory.js";
import { removeRealtimeChannel, setRealtimeAuth, subscribeToTableChanges } from "../services/realtime.js";
import { notifyBackgroundError } from "./notification-store.js";

/**
 * Inventory items store with API-backed mutations and realtime sync.
 * @module stores/inventory-store
 */

const friendlyError = (error, fallback) =>
  error && typeof error.message === "string" && error.message.trim() ? error.message : fallback;

function sortItems(items) {
  return [...items].sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
}


function upsertItem(items, item) {
  const index = items.findIndex((entry) => entry.id === item.id);
  if (index === -1) return sortItems([...items, item]);
  if (isSameRecord(items[index], { ...items[index], ...item })) return items;
  const next = [...items];
  next[index] = { ...next[index], ...item };
  return sortItems(next);
}

/**
 * Zustand store hook for inventory state and actions.
 */
export const useInventoryStore = create((set, get) => ({
  items: [],
  loading: false,
  syncing: false,
  error: null,
  channel: null,
  subscribed: false,

  clearError: () => set({ error: null }),

  /**
   * Loads inventory items from the API.
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
    set({ loading: !isRefresh, syncing: isRefresh, error: null });
    try {
      const data = await getInventoryItems(token);
      set({ items: sortItems(data.items || []), loading: false, syncing: false, error: null });
    } catch (error) {
      const message = friendlyError(error, "Could not load inventory. Please try again.");
      set({ loading: false, syncing: false, error: message });
      if (background || hasItems) notifyBackgroundError(message);
      throw error;
    }
  },

  /**
   * Subscribes to realtime inventory changes.
   *
   * @param {string} token - Access token.
   * @returns {void}
   */
  subscribe: (token) => {
    if (get().channel) {
      setRealtimeAuth(token);
      return;
    }
    try {
      const channel = subscribeToTableChanges({
        channelName: "public:inventory_items",
        table: "inventory_items",
        token,
        onPayload: (payload) => {
          let changed = false;
          if (payload.eventType === "DELETE") {
            const id = payload.old?.id;
            if (id && get().items.some((item) => item.id === id)) {
              changed = true;
              set((s) => ({ items: s.items.filter((item) => item.id !== id), syncing: true }));
            }
          } else if (payload.new) {
            const item = payload.new;
            const current = get().items.find((entry) => entry.id === item.id);
            if (!isSameRecord(current, current ? { ...current, ...item } : item)) {
              changed = true;
              set((s) => ({ items: upsertItem(s.items, item), syncing: true }));
            }
          }
          if (changed) setTimeout(() => set({ syncing: false }), 350);
        },
        onStatus: (status) => {
          if (status === "SUBSCRIBED") set({ subscribed: true, error: null });
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            notifyBackgroundError("Live inventory updates are temporarily unavailable.");
          }
        }
      });
      set({ channel, subscribed: false });
    } catch (error) {
      notifyBackgroundError(friendlyError(error, "Could not connect to live inventory updates."));
    }
  },

  /**
   * Unsubscribes from realtime inventory changes.
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
    } catch {
      notifyBackgroundError("Could not disconnect live inventory updates cleanly.");
    } finally {
      set({ subscribed: false, channel: null });
    }
  },

  /**
   * Creates an inventory item.
   *
   * @param {string} token - Access token.
   * @param {object} input - Inventory fields.
   * @returns {Promise<object>} Created item.
   */
  createItem: async (token, input) => {
    set({ syncing: true, error: null });
    try {
      const data = await createInventoryItem(token, input);
      if (data?.item) set((s) => ({ items: upsertItem(s.items, data.item) }));
      return data?.item;
    } catch (error) {
      const message = friendlyError(error, "Could not create the inventory item. Please try again.");
      set({ error: message });
      throw error;
    } finally {
      set({ syncing: false });
    }
  },

  /**
   * Updates an inventory item.
   *
   * @param {string} token - Access token.
   * @param {string} id - Item id.
   * @param {object} input - Fields to update.
   * @returns {Promise<object>} Updated item.
   */
  updateItem: async (token, id, input) => {
    set({ syncing: true, error: null });
    try {
      const data = await updateInventoryItem(token, id, input);
      if (data?.item) set((s) => ({ items: upsertItem(s.items, data.item) }));
      return data?.item;
    } catch (error) {
      const message = friendlyError(error, "Could not update the inventory item. Please try again.");
      set({ error: message });
      throw error;
    } finally {
      set({ syncing: false });
    }
  },

  /**
   * Deletes an inventory item.
   *
   * @param {string} token - Access token.
   * @param {string} id - Item id.
   * @returns {Promise<void>}
   */
  removeItem: async (token, id) => {
    set({ syncing: true, error: null });
    try {
      await deleteInventoryItem(token, id);
      set((s) => ({ items: s.items.filter((item) => item.id !== id) }));
    } catch (error) {
      const message = friendlyError(error, "Could not delete the inventory item. Please try again.");
      set({ error: message });
      throw error;
    } finally {
      set({ syncing: false });
    }
  },

  /**
   * Resets store state.
   *
   * @returns {void}
   */
  reset: () => set({ items: [], loading: false, syncing: false, error: null, channel: null, subscribed: false })
}));
