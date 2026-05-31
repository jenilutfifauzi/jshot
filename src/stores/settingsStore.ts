import { create } from 'zustand';
import type { AppSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';
import { storage } from '@/services/storage';
import { logger } from '@/lib/logger';

interface SettingsState extends AppSettings {
  loaded: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<AppSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  loaded: false,

  load: async () => {
    try {
      const s = await storage.loadSettings();
      set({ ...s, loaded: true });
    } catch (e) {
      logger.error('Failed to load settings', e);
      set({ loaded: true });
    }
  },

  update: async (patch) => {
    set(patch as Partial<SettingsState>);
    const { loaded: _loaded, load: _load, update: _update, ...current } = get();
    void _loaded;
    void _load;
    void _update;
    try {
      await storage.saveSettings(current as AppSettings);
    } catch (e) {
      logger.error('Failed to save settings', e);
    }
  },
}));
