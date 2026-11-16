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

/**
 * Unified transactions store (buy/sell records).
 * @module stores/transactions-store
 */

const friendlyError = (error, fallback) =>
  error && typeof error.message === "string" && error.message.trim() ? error.message : fallback;

function sortTx(items) {
  return [...items].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
}

export const useTransactionsStore = create((set) => ({
  myTransactions: [],
  adminTransactions: [],
  loading: false,
  syncing: false,
  error: null,
  clearError: () => set({ error: null }),

  fetchMyTransactions: async (token) => {
    if (!token) return set({ myTransactions: [], loading: false });
    set({ loading: true, error: null });
    try {
      const data = await getMyTransactions(token);
      set({ myTransactions: sortTx(data.transactions || []), loading: false });
    } catch (e) {
      set({ loading: false, error: friendlyError(e, "Could not load transactions.") });
      throw e;
    }
  },

  fetchAdminTransactions: async (token) => {
    if (!token) return set({ adminTransactions: [], loading: false });
    set({ loading: true, error: null });
    try {
      const data = await getAdminTransactions(token);
      set({ adminTransactions: sortTx(data.transactions || []), loading: false });
    } catch (e) {
      set({ loading: false, error: friendlyError(e, "Could not load transactions.") });
      throw e;
    }
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
