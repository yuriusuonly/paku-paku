import { create } from "zustand";
import { getAdminInvoices, getMyInvoices, updateAdminInvoice, deleteAdminInvoice } from "../services/invoices.js";

/**
 * Invoices store.
 * @module stores/invoices-store
 */

const friendlyError = (error, fallback) =>
  error && typeof error.message === "string" && error.message.trim() ? error.message : fallback;

function sortInvoices(items) {
  return [...items].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
}

export const useInvoicesStore = create((set) => ({
  myInvoices: [],
  adminInvoices: [],
  loading: false,
  syncing: false,
  error: null,
  clearError: () => set({ error: null }),

  fetchMyInvoices: async (token) => {
    if (!token) return set({ myInvoices: [], loading: false });
    set({ loading: true, error: null });
    try {
      const data = await getMyInvoices(token);
      set({ myInvoices: sortInvoices(data.invoices || []), loading: false });
    } catch (e) {
      set({ loading: false, error: friendlyError(e, "Could not load invoices.") });
      throw e;
    }
  },

  fetchAdminInvoices: async (token) => {
    if (!token) return set({ adminInvoices: [], loading: false });
    set({ loading: true, error: null });
    try {
      const data = await getAdminInvoices(token);
      set({ adminInvoices: sortInvoices(data.invoices || []), loading: false });
    } catch (e) {
      set({ loading: false, error: friendlyError(e, "Could not load invoices.") });
      throw e;
    }
  },

  updateAdminInvoice: async (token, id, input) => {
    set({ syncing: true, error: null });
    try {
      const data = await updateAdminInvoice(token, id, input);
      if (data?.invoice) set((s) => ({ adminInvoices: s.adminInvoices.map((i) => (i.id === id ? data.invoice : i)) }));
      return data?.invoice;
    } catch (e) {
      set({ error: friendlyError(e, "Could not update the invoice.") });
      throw e;
    } finally { set({ syncing: false }); }
  },

  removeAdminInvoice: async (token, id) => {
    set({ syncing: true, error: null });
    try {
      await deleteAdminInvoice(token, id);
      set((s) => ({ adminInvoices: s.adminInvoices.filter((i) => i.id !== id) }));
    } catch (e) {
      set({ error: friendlyError(e, "Could not delete the invoice.") });
      throw e;
    } finally { set({ syncing: false }); }
  }
}));
