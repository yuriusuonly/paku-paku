import { create } from "zustand";
import { getProfiles } from "../services/admin.js";
import { getSupabase } from "../database/instance.js";
import { notifyBackgroundError } from "./notification-store.js";

const friendlyError = (error, fallback) =>
  error && typeof error.message === "string" && error.message.trim() ? error.message : fallback;

function sortProfiles(items) {
  return [...items].sort((a, b) => String(a.username || "").localeCompare(String(b.username || "")));
}

export const useProfilesStore = create((set, get) => ({
  profiles: [],
  loading: false,
  syncing: false,
  error: null,
  channel: null,
  subscribed: false,

  clearError: () => set({ error: null }),

  fetchProfiles: async (token, { background = false } = {}) => {
    if (!token) {
      set({ profiles: [], loading: false, syncing: false, error: null });
      return;
    }
    const hasData = get().profiles.length > 0;
    const isRefresh = background || hasData;
    set({ loading: !isRefresh, syncing: isRefresh, error: null });
    try {
      const data = await getProfiles(token);
      set({ profiles: sortProfiles(data.profiles || []), loading: false, syncing: false, error: null });
    } catch (error) {
      const message = friendlyError(error, "Could not load profiles. Please try again.");
      set({ loading: false, syncing: false, error: message });
      if (background || hasData) notifyBackgroundError(message);
      throw error;
    }
  },

  subscribe: () => {
    if (get().channel) return;
    try {
      const supabase = getSupabase();
      const channel = supabase
        .channel("public:profiles")
        .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, (payload) => {
          set({ syncing: true });
          if (payload.eventType === "DELETE") {
            const id = payload.old?.id;
            if (id) set((s) => ({ profiles: s.profiles.filter((p) => p.id !== id) }));
          } else if (payload.new) {
            const row = payload.new;
            set((s) => {
              const idx = s.profiles.findIndex((p) => p.id === row.id);
              if (idx === -1) return { profiles: sortProfiles([...s.profiles, row]) };
              const next = [...s.profiles];
              next[idx] = { ...next[idx], ...row };
              return { profiles: sortProfiles(next) };
            });
          }
          setTimeout(() => set({ syncing: false }), 350);
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") set({ subscribed: true, error: null });
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            notifyBackgroundError("Live profile updates are temporarily unavailable.");
          }
        });
      set({ channel });
    } catch (error) {
      notifyBackgroundError(friendlyError(error, "Could not connect to live profile updates."));
    }
  },

  unsubscribe: async () => {
    const { channel } = get();
    if (!channel) return;
    try {
      await getSupabase().removeChannel(channel);
    } catch {
      notifyBackgroundError("Could not disconnect live profile updates cleanly.");
    } finally {
      set({ channel: null, subscribed: false });
    }
  },

  reset: () => set({ profiles: [], loading: false, syncing: false, error: null })
}));
