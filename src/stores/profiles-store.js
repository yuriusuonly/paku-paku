import { create } from "zustand";
import { getProfiles, createProfileUser, updateProfile as updateProfileApi } from "../services/admin.js";
import { getDatabaseClient } from "../database/instance.js";
import { notifyBackgroundError } from "./notification-store.js";

const friendlyError = (error, fallback) =>
  error && typeof error.message === "string" && error.message.trim() ? error.message : fallback;

function isVisibleProfile(profile) {
  return profile?.username !== "root";
}

function sortProfiles(items) {
  return [...items].sort((a, b) => String(a.username || "").localeCompare(String(b.username || "")));
}

function upsertProfile(items, profile) {
  if (!isVisibleProfile(profile)) {
    return items.filter((entry) => entry.id !== profile?.id && entry.username !== "root");
  }
  const index = items.findIndex((entry) => entry.id === profile.id);
  if (index === -1) {
    return sortProfiles([...items, profile]);
  }
  const next = [...items];
  next[index] = { ...next[index], ...profile };
  return sortProfiles(next);
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
      set({
        profiles: sortProfiles((data.profiles || []).filter(isVisibleProfile)),
        loading: false,
        syncing: false,
        error: null
      });
    } catch (error) {
      const message = friendlyError(error, "Could not load profiles. Please try again.");
      set({ loading: false, syncing: false, error: message });
      if (background || hasData) notifyBackgroundError(message);
      throw error;
    }
  },

  createUser: async (token, input) => {
    set({ syncing: true, error: null });
    try {
      const data = await createProfileUser(token, input);
      if (data?.profile) {
        set((s) => ({ profiles: upsertProfile(s.profiles, data.profile) }));
      }
      return data?.profile;
    } catch (error) {
      const message = friendlyError(error, "Could not create the user. Please try again.");
      set({ error: message });
      throw error;
    } finally {
      set({ syncing: false });
    }
  },

  setProfileActive: async (token, id, isActive) => {
    set({ syncing: true, error: null });
    try {
      const data = await updateProfileApi(token, { id, is_active: isActive });
      if (data?.profile) {
        set((s) => ({ profiles: upsertProfile(s.profiles, data.profile) }));
      }
      return data?.profile;
    } catch (error) {
      const message = friendlyError(error, "Could not update the profile. Please try again.");
      set({ error: message });
      throw error;
    } finally {
      set({ syncing: false });
    }
  },

  subscribe: (token) => {
    if (get().channel) {
      if (token) {
        try {
          getDatabaseClient().realtime.setAuth(token);
        } catch {}
      }
      return;
    }
    try {
      const database = getDatabaseClient();
      if (token) {
        database.realtime.setAuth(token);
      }
      const channel = database
        .channel("public:profiles")
        .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, (payload) => {
          set({ syncing: true });
          if (payload.eventType === "DELETE") {
            const id = payload.old?.id;
            if (id) set((s) => ({ profiles: s.profiles.filter((p) => p.id !== id) }));
          } else if (payload.new) {
            set((s) => ({ profiles: upsertProfile(s.profiles, payload.new) }));
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
      await getDatabaseClient().removeChannel(channel);
    } catch {
      notifyBackgroundError("Could not disconnect live profile updates cleanly.");
    } finally {
      set({ channel: null, subscribed: false });
    }
  },

  reset: () => set({ profiles: [], loading: false, syncing: false, error: null })
}));
