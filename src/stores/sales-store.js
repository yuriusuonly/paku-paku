import { create } from "zustand";
import { createSale, deleteSale, getSales, updateSale } from "../services/sales.js";
import { removeRealtimeChannel, setRealtimeAuth, subscribeToTableChanges } from "../services/realtime.js";
import { notifyBackgroundError } from "./notification-store.js";

/**
 * Sales store with API-backed mutations and realtime sync.
 * @module stores/sales-store
 */

const friendlyError = (error, fallback) =>
  error && typeof error.message === "string" && error.message.trim() ? error.message : fallback;

function sortSales(sales) {
  return [...sales].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
}

function upsertSale(sales, sale) {
  const index = sales.findIndex((entry) => entry.id === sale.id);
  if (index === -1) return sortSales([...sales, sale]);
  const next = [...sales];
  next[index] = { ...next[index], ...sale };
  return sortSales(next);
}

/**
 * Zustand store hook for sales state and actions.
 */
export const useSalesStore = create((set, get) => ({
  sales: [],
  loading: false,
  syncing: false,
  error: null,
  channel: null,
  itemsChannel: null,
  subscribed: false,

  clearError: () => set({ error: null }),

  /**
   * Loads sales from the API.
   *
   * @param {string} token - Access token.
   * @param {{background?: boolean}} [options] - Load options.
   * @returns {Promise<void>}
   */
  fetchSales: async (token, { background = false } = {}) => {
    if (!token) {
      set({ sales: [], loading: false, syncing: false, error: null });
      return;
    }
    const hasData = get().sales.length > 0;
    const isRefresh = background || hasData;
    set({ loading: !isRefresh, syncing: isRefresh, error: null });
    try {
      const data = await getSales(token);
      set({ sales: sortSales(data.sales || []), loading: false, syncing: false, error: null });
    } catch (error) {
      const message = friendlyError(error, "Could not load sales. Please try again.");
      set({ loading: false, syncing: false, error: message });
      if (background || hasData) notifyBackgroundError(message);
      throw error;
    }
  },

  /**
   * Subscribes to realtime sales changes and refreshes on events.
   *
   * @param {string} token - Access token.
   * @returns {void}
   */
  subscribe: (token) => {
    if (get().channel || get().itemsChannel) {
      setRealtimeAuth(token);
      return;
    }
    const refresh = () => {
      set({ syncing: true });
      void get().fetchSales(token, { background: true }).finally(() => {
        setTimeout(() => set({ syncing: false }), 300);
      });
    };

    try {
      const channel = subscribeToTableChanges({
        channelName: "public:sales",
        table: "sales",
        token,
        onPayload: refresh,
        onStatus: (status) => {
          if (status === "SUBSCRIBED") set({ subscribed: true, error: null });
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            notifyBackgroundError("Live sales updates are temporarily unavailable.");
          }
        }
      });
      const itemsChannel = subscribeToTableChanges({
        channelName: "public:sale_items",
        table: "sale_items",
        token,
        onPayload: refresh
      });
      set({ channel, itemsChannel, subscribed: false });
    } catch (error) {
      notifyBackgroundError(friendlyError(error, "Could not connect to live sales updates."));
    }
  },

  /**
   * Unsubscribes from realtime sales changes.
   *
   * @returns {Promise<void>}
   */
  unsubscribe: async () => {
    const { channel, itemsChannel } = get();
    try {
      if (channel) await removeRealtimeChannel(channel);
      if (itemsChannel) await removeRealtimeChannel(itemsChannel);
    } catch {
      notifyBackgroundError("Could not disconnect live sales updates cleanly.");
    } finally {
      set({ channel: null, itemsChannel: null, subscribed: false });
    }
  },

  /**
   * Creates a sale.
   *
   * @param {string} token - Access token.
   * @param {object} input - Sale fields.
   * @returns {Promise<object>} Created sale.
   */
  createSale: async (token, input) => {
    set({ syncing: true, error: null });
    try {
      const data = await createSale(token, input);
      if (data?.sale) set((s) => ({ sales: upsertSale(s.sales, data.sale) }));
      return data?.sale;
    } catch (error) {
      const message = friendlyError(error, "Could not create the sale. Please try again.");
      set({ error: message });
      throw error;
    } finally {
      set({ syncing: false });
    }
  },

  /**
   * Updates a sale.
   *
   * @param {string} token - Access token.
   * @param {string} id - Sale id.
   * @param {object} input - Fields to update.
   * @returns {Promise<object>} Updated sale.
   */
  updateSale: async (token, id, input) => {
    set({ syncing: true, error: null });
    try {
      const data = await updateSale(token, id, input);
      if (data?.sale) set((s) => ({ sales: upsertSale(s.sales, data.sale) }));
      return data?.sale;
    } catch (error) {
      const message = friendlyError(error, "Could not update the sale. Please try again.");
      set({ error: message });
      throw error;
    } finally {
      set({ syncing: false });
    }
  },

  /**
   * Deletes a sale.
   *
   * @param {string} token - Access token.
   * @param {string} id - Sale id.
   * @returns {Promise<void>}
   */
  removeSale: async (token, id) => {
    set({ syncing: true, error: null });
    try {
      await deleteSale(token, id);
      set((s) => ({ sales: s.sales.filter((sale) => sale.id !== id) }));
    } catch (error) {
      const message = friendlyError(error, "Could not delete the sale. Please try again.");
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
  reset: () => set({ sales: [], loading: false, syncing: false, error: null, channel: null, itemsChannel: null, subscribed: false })
}));
