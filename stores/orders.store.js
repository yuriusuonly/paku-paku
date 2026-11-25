import { create } from "zustand";
import { sortByCreatedDesc } from "../helpers/lists.js";
import { getErrorMessage } from "../errors/message.js";
import {
  createAdminOrder,
  deleteAdminOrder,
  getAdminOrders,
  updateAdminOrder
} from "../services/orders.js";
import { removeRealtimeChannel, setRealtimeAuth, subscribeToTableChanges } from "../services/realtime.js";
import { notifyBackgroundError } from "./notification.store.js";

/**
 * Admin order store. Customer orders are placed through the public checkout.
 * @module stores/orders.store
 */

export const useOrdersStore = create((set, get) => ({
  adminOrders: [],
  loading: false,
  syncing: false,
  error: null,
  channels: [],
  refetchTimer: null,

  clearError: () => set({ error: null }),

  fetchAdminOrders: async (token, { background = false } = {}) => {
    if (!token) return set({ adminOrders: [], loading: false });
    const has = get().adminOrders.length > 0;
    const isRefresh = background || has;
    if (isRefresh) set({ syncing: true, error: null }); else set({ loading: true, error: null });
    try {
      const data = await getAdminOrders(token);
      set({ adminOrders: sortByCreatedDesc(data.orders || []), loading: false, syncing: false });
    } catch (e) {
      set({ loading: false, syncing: false, error: getErrorMessage(e, "Could not load orders.") });
      throw e;
    }
  },

  scheduleRealtimeRefetch: () => {
    const { refetchTimer, fetchAdminOrders } = get();
    if (refetchTimer) clearTimeout(refetchTimer);
    const timer = setTimeout(() => {
      const { adminToken } = get();
      if (adminToken) void fetchAdminOrders(adminToken, { background: true }).catch(() => {});
      set({ refetchTimer: null });
    }, 250);
    set({ refetchTimer: timer });
  },

  subscribeAdmin: (token) => {
    if (!token) return;
    set({ adminToken: token });
    if (get().channels.length) {
      setRealtimeAuth(token);
      return;
    }
    try {
      const onPayload = () => get().scheduleRealtimeRefetch();
      const orders = subscribeToTableChanges({ channelName: "public:orders", table: "orders", token, onPayload });
      const items = subscribeToTableChanges({ channelName: "public:order_items", table: "order_items", token, onPayload });
      set({ channels: [orders, items] });
    } catch (error) {
      notifyBackgroundError(getErrorMessage(error, "Could not connect to live order updates."));
    }
  },

  unsubscribe: async () => {
    const { channels, refetchTimer } = get();
    if (refetchTimer) clearTimeout(refetchTimer);
    for (const channel of channels) {
      try { await removeRealtimeChannel(channel); } catch {}
    }
    set({ channels: [], refetchTimer: null, adminToken: null });
  },

  createAdminOrder: async (token, input) => {
    set({ syncing: true, error: null });
    try {
      const data = await createAdminOrder(token, input);
      if (data?.order) set((s) => ({ adminOrders: sortByCreatedDesc([data.order, ...s.adminOrders]) }));
      return data?.order;
    } catch (e) {
      set({ error: getErrorMessage(e, "Could not create the order.") });
      throw e;
    } finally { set({ syncing: false }); }
  },

  updateAdminOrder: async (token, id, input) => {
    set({ syncing: true, error: null });
    try {
      const data = await updateAdminOrder(token, id, input);
      if (data?.order) set((s) => ({ adminOrders: s.adminOrders.map((t) => (t.id === id ? data.order : t)) }));
      return data?.order;
    } catch (e) {
      set({ error: getErrorMessage(e, "Could not update the order.") });
      throw e;
    } finally { set({ syncing: false }); }
  },

  removeAdminOrder: async (token, id) => {
    set({ syncing: true, error: null });
    try {
      await deleteAdminOrder(token, id);
      set((s) => ({ adminOrders: s.adminOrders.filter((t) => t.id !== id) }));
    } catch (e) {
      set({ error: getErrorMessage(e, "Could not delete the order.") });
      throw e;
    } finally { set({ syncing: false }); }
  }
}));
