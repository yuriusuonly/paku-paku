import { create } from "zustand";
import { createOrder, getAdminOrders, getMyOrders, updateAdminOrder, deleteAdminOrder, updateOrder } from "../services/orders.js";

/**
 * Orders store (customer and admin views).
 * @module stores/orders-store
 */

const friendlyError = (error, fallback) =>
  error && typeof error.message === "string" && error.message.trim() ? error.message : fallback;

function sortOrders(items) {
  return [...items].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
}

export const useOrdersStore = create((set, get) => ({
  myOrders: [],
  adminOrders: [],
  loading: false,
  syncing: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchMyOrders: async (token) => {
    if (!token) return set({ myOrders: [], loading: false });
    set({ loading: true, error: null });
    try {
      const data = await getMyOrders(token);
      set({ myOrders: sortOrders(data.orders || []), loading: false });
    } catch (e) {
      set({ loading: false, error: friendlyError(e, "Could not load your orders.") });
      throw e;
    }
  },

  fetchAdminOrders: async (token) => {
    if (!token) return set({ adminOrders: [], loading: false });
    set({ loading: true, error: null });
    try {
      const data = await getAdminOrders(token);
      set({ adminOrders: sortOrders(data.orders || []), loading: false });
    } catch (e) {
      set({ loading: false, error: friendlyError(e, "Could not load orders.") });
      throw e;
    }
  },

  placeOrder: async (token, input) => {
    set({ syncing: true, error: null });
    try {
      const data = await createOrder(token, input);
      if (data?.order) set((s) => ({ myOrders: sortOrders([data.order, ...s.myOrders]) }));
      return data;
    } catch (e) {
      set({ error: friendlyError(e, "Could not place the order.") });
      throw e;
    } finally {
      set({ syncing: false });
    }
  },

  updateMyOrder: async (token, id, input) => {
    set({ syncing: true, error: null });
    try {
      const data = await updateOrder(token, id, input);
      if (data?.order) set((s) => ({ myOrders: s.myOrders.map((o) => (o.id === id ? data.order : o)) }));
      return data?.order;
    } catch (e) {
      set({ error: friendlyError(e, "Could not update the order.") });
      throw e;
    } finally {
      set({ syncing: false });
    }
  },

  updateAdminOrder: async (token, id, input) => {
    set({ syncing: true, error: null });
    try {
      const data = await updateAdminOrder(token, id, input);
      if (data?.order) set((s) => ({ adminOrders: s.adminOrders.map((o) => (o.id === id ? data.order : o)) }));
      return data?.order;
    } catch (e) {
      set({ error: friendlyError(e, "Could not update the order.") });
      throw e;
    } finally {
      set({ syncing: false });
    }
  },

  removeAdminOrder: async (token, id) => {
    set({ syncing: true, error: null });
    try {
      await deleteAdminOrder(token, id);
      set((s) => ({ adminOrders: s.adminOrders.filter((o) => o.id !== id) }));
    } catch (e) {
      set({ error: friendlyError(e, "Could not delete the order.") });
      throw e;
    } finally {
      set({ syncing: false });
    }
  }
}));
