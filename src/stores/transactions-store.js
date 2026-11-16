import { create } from "zustand";
import {
  createAdminTransaction,
  createTransaction,
  deleteAdminTransaction,
  getAdminTransactions,
  getMyTransactions,
  updateAdminTransaction,
  updateTransaction
} from "../services/transactions.js";
import { removeRealtimeChannel, setRealtimeAuth, subscribeToTableChanges } from "../services/realtime.js";
import { notifyBackgroundError } from "./notification-store.js";

/**
 * Unified transactions store (buy/sell records).
 * @module stores/transactions-store
 */

const friendlyError = (error, fallback) =>
  error && typeof error.message === "string" && error.message.trim() ? error.message : fallback;

function sortTx(items) {
  return [...items].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
}

export const useTransactionsStore = create((set, get) => ({
  myTransactions: [],
  adminTransactions: [],
  loading: false,
  syncing: false,
  error: null,
  channels: [],
  adminToken: null,
  myToken: null,
  refetchTimer: null,
  clearError: () => set({ error: null }),

  fetchMyTransactions: async (token, { background = false } = {}) => {
    if (!token) return set({ myTransactions: [], loading: false });
    const has = get().myTransactions.length > 0;
    const isRefresh = background || has;
    if (isRefresh) set({ syncing: true, error: null }); else set({ loading: true, error: null });
    try {
      const data = await getMyTransactions(token);
      set({ myTransactions: sortTx(data.transactions || []), loading: false, syncing: false });
    } catch (e) {
      set({ loading: false, syncing: false, error: friendlyError(e, "Could not load transactions.") });
      throw e;
    }
  },

  fetchAdminTransactions: async (token, { background = false } = {}) => {
    if (!token) return set({ adminTransactions: [], loading: false });
    const has = get().adminTransactions.length > 0;
    const isRefresh = background || has;
    if (isRefresh) set({ syncing: true, error: null }); else set({ loading: true, error: null });
    try {
      const data = await getAdminTransactions(token);
      set({ adminTransactions: sortTx(data.transactions || []), loading: false, syncing: false });
    } catch (e) {
      set({ loading: false, syncing: false, error: friendlyError(e, "Could not load transactions.") });
      throw e;
    }
  },

  scheduleRealtimeRefetch: () => {
    const { refetchTimer, adminToken, myToken, fetchAdminTransactions, fetchMyTransactions } = get();
    if (refetchTimer) clearTimeout(refetchTimer);
    const timer = setTimeout(() => {
      if (adminToken) void fetchAdminTransactions(adminToken, { background: true }).catch(() => {});
      if (myToken) void fetchMyTransactions(myToken, { background: true }).catch(() => {});
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
      notifyBackgroundError(friendlyError(error, "Could not connect to live transaction updates."));
    }
  },

  subscribeMy: (token) => {
    if (!token) return;
    set({ myToken: token });
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
      notifyBackgroundError(friendlyError(error, "Could not connect to live transaction updates."));
    }
  },

  unsubscribe: async () => {
    const { channels, refetchTimer } = get();
    if (refetchTimer) clearTimeout(refetchTimer);
    for (const channel of channels) {
      try { await removeRealtimeChannel(channel); } catch {}
    }
    set({ channels: [], refetchTimer: null, adminToken: null, myToken: null });
  },

  createMyTransaction: async (token, input) => {
    set({ syncing: true, error: null });
    try {
      const data = await createTransaction(token, input);
      if (data?.transaction) set((s) => ({ myTransactions: sortTx([data.transaction, ...s.myTransactions]) }));
      return data;
    } catch (e) {
      set({ error: friendlyError(e, "Could not place the transaction.") });
      throw e;
    } finally {
      set({ syncing: false });
    }
  },

  updateMyTransaction: async (token, id, input) => {
    set({ syncing: true, error: null });
    try {
      const data = await updateTransaction(token, id, input);
      if (data?.transaction) set((s) => ({ myTransactions: s.myTransactions.map((t) => (t.id === id ? data.transaction : t)) }));
      return data?.transaction;
    } catch (e) {
      set({ error: friendlyError(e, "Could not update the transaction.") });
      throw e;
    } finally {
      set({ syncing: false });
    }
  },

  createAdminTransaction: async (token, input) => {
    set({ syncing: true, error: null });
    try {
      const data = await createAdminTransaction(token, input);
      if (data?.transaction) set((s) => ({ adminTransactions: sortTx([data.transaction, ...s.adminTransactions]) }));
      return data?.transaction;
    } catch (e) {
      set({ error: friendlyError(e, "Could not create the transaction.") });
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
      set({ error: friendlyError(e, "Could not update the transaction.") });
      throw e;
    } finally { set({ syncing: false }); }
  },

  removeAdminTransaction: async (token, id) => {
    set({ syncing: true, error: null });
    try {
      await deleteAdminTransaction(token, id);
      set((s) => ({ adminTransactions: s.adminTransactions.filter((t) => t.id !== id) }));
    } catch (e) {
      set({ error: friendlyError(e, "Could not delete the transaction.") });
      throw e;
    } finally { set({ syncing: false }); }
  }
}));
