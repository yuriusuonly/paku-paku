import { create } from "zustand";
import { sortByCreatedDesc } from "../shared/utils/lists.js";
import { getErrorMessage } from "../shared/errors/message.js";
import { createStaffOrder, getStaffOrders, updateOrderStatus, verifyOrder } from "../services/staff.js";

/**
 * Staff order taking and order logs store.
 * @module stores/staff-orders.store
 */

export const useStaffOrdersStore = create((set) => ({
  order: null,
  orders: [],
  loading: false,
  logsLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  clear: () => set({ order: null, error: null }),

  fetchLogs: async (token) => {
    if (!token) return set({ orders: [], logsLoading: false });
    set({ logsLoading: true, error: null });
    try {
      const data = await getStaffOrders(token);
      set({ orders: sortByCreatedDesc(data.orders || []), logsLoading: false });
    } catch (error) {
      set({
        logsLoading: false,
        error: getErrorMessage(error, "Could not load order logs.")
      });
      throw error;
    }
  },

  createOrder: async (token, input) => {
    if (!token) return;
    set({ loading: true, error: null });
    try {
      const data = await createStaffOrder(token, input);
      const created = data?.order || null;
      if (created) {
        set((state) => ({ orders: sortByCreatedDesc([created, ...state.orders]) }));
      }
      set({ loading: false });
      return created;
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error, "Could not create the order.") });
      throw error;
    }
  },

  verify: async (token, reference) => {
    if (!token) return;
    set({ loading: true, error: null, order: null });
    try {
      const data = await verifyOrder(token, reference);
      set({ order: data?.order || null, loading: false });
      return data?.order || null;
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error, "Could not verify that order.") });
      throw error;
    }
  },

  setStatus: async (token, id, status) => {
    if (!token || !id) return;
    set({ loading: true, error: null });
    try {
      const data = await updateOrderStatus(token, id, status);
      const updated = data?.order || null;
      set((state) => ({
        order: updated,
        orders: updated
          ? state.orders.map((entry) => (entry.id === updated.id ? updated : entry))
          : state.orders,
        loading: false
      }));
      return updated;
    } catch (error) {
      set({ loading: false, error: getErrorMessage(error, "Could not update the order.") });
      throw error;
    }
  }
}));
