import { create } from "zustand";
import { sortByCreatedDesc } from "../shared/utils/lists.js";
import { getErrorMessage } from "../shared/errors/message.js";
import {
  createAdminTransaction,
  deleteAdminTransaction,
  getAdminTransactions,
  updateAdminTransaction
} from "../services/transactions.js";
import { removeRealtimeChannel, setRealtimeAuth, subscribeToTableChanges } from "../services/realtime.js";
import { notifyBackgroundError } from "./notification.store.js";

/**
 * Admin transaction store. Customer orders are placed through the public checkout.
 * @module stores/transactions.store
 */

export const useTransactionsStore = create((set, get) => ({
  adminTransactions: [],
  loading: false,
  syncing: false,
  error: null,
  channels: [],
  refetchTimer: null,

  clearError: () => set({ error: null }),

  fetchAdminTransactions: async (token, { background = false } = {}) => {
    if (!token) return set({ adminTransactions: [], loading: false });
    const has = get().adminTransactions.length > 0;
    const isRefresh = background || has;
    if (isRefresh) set({ syncing: true, error: null }); else set({ loading: true, error: null });
    try {
      const data = await getAdminTransactions(token);
      set({ adminTransactions: sortByCreatedDesc(data.transactions || []), loading: false, syncing: false });
    } catch (e) {
      set({ loading: false, syncing: false, error: getErrorMessage(e, "Could not load transactions.") });
      throw e;
    }
  },

  scheduleRealtimeRefetch: () => {
    const { refetchTimer, fetchAdminTransactions } = get();
    if (refetchTimer) clearTimeout(refetchTimer);
    const timer = setTimeout(() => {
      const { adminToken } = get();
      if (adminToken) void fetchAdminTransactions(adminToken, { background: true }).catch(() => {});
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
      notifyBackgroundError(getErrorMessage(error, "Could not connect to live transaction updates."));
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

  createAdminTransaction: async (token, input) => {
    set({ syncing: true, error: null });
    try {
      const data = await createAdminTransaction(token, input);
      if (data?.transaction) set((s) => ({ adminTransactions: sortByCreatedDesc([data.transaction, ...s.adminTransactions]) }));
      return data?.transaction;
    } catch (e) {
      set({ error: getErrorMessage(e, "Could not create the transaction.") });
      throw e;
    } finally { set({ syncing: false }); }
  },

  updateAdminTransaction: async (token, id, input) => {
    set({ syncing: true, error: null });
    try {
      const data = await updateAdminTransaction(token, id, input);
      if (data?.transaction) set((s) => ({ adminTransactions: s.adminTransactions.map((t) => (t.id === id ? data.transaction : t)) }));
      return data?.transaction;
    } catch (e) {
      set({ error: getErrorMessage(e, "Could not update the transaction.") });
      throw e;
    } finally { set({ syncing: false }); }
  },

  removeAdminTransaction: async (token, id) => {
    set({ syncing: true, error: null });
    try {
      await deleteAdminTransaction(token, id);
      set((s) => ({ adminTransactions: s.adminTransactions.filter((t) => t.id !== id) }));
    } catch (e) {
      set({ error: getErrorMessage(e, "Could not delete the transaction.") });
      throw e;
    } finally { set({ syncing: false }); }
  }
}));
