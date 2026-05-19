import { create } from "zustand";
import type { UserSettings } from "../types";
import { fetchUserSettings, updateUserSettings } from "../api/settings";

interface SettingsState {
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
  fetchSettings: (userId: string) => Promise<void>;
  updateSettings: (
    userId: string,
    settings: Partial<UserSettings>,
  ) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  loading: false,
  error: null,

  fetchSettings: async (userId) => {
    set({ loading: true, error: null });
    try {
      const settings = await fetchUserSettings(userId);
      set({ settings, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  updateSettings: async (userId, newSettings) => {
    set({ loading: true, error: null });
    try {
      const settings = await updateUserSettings(userId, newSettings);
      set({ settings, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));
