import { create } from "zustand";

/**
 * Global app/client state store.
 * @module stores/app-store
 */

/**
 * Zustand store hook for shared app state.
 *
 * @type {import("zustand").UseBoundStore<import("zustand").StoreApi<{ready: boolean, setReady: (ready: boolean) => void}>>}
 */
export const useAppStore = create((set) => ({
  ready: false,
  setReady: (ready) => set({ ready })
}));
