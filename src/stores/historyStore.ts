import { create } from 'zustand';
import type { ScreenshotItem } from '@/types';
import { storage } from '@/services/storage';
import { logger } from '@/lib/logger';

interface HistoryState {
  items: ScreenshotItem[];
  loaded: boolean;
  load: () => Promise<void>;
  add: (item: ScreenshotItem) => Promise<void>;
  update: (id: string, patch: Partial<ScreenshotItem>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
}

const MAX_HISTORY = 200;

export const useHistoryStore = create<HistoryState>((set, get) => ({
  items: [],
  loaded: false,

  load: async () => {
    try {
      const items = await storage.loadHistory();
      set({ items, loaded: true });
    } catch (e) {
      logger.error('Failed to load history', e);
      set({ loaded: true });
    }
  },

  add: async (item) => {
    const items = [item, ...get().items].slice(0, MAX_HISTORY);
    set({ items });
    await storage.saveHistory(items);
  },

  update: async (id, patch) => {
    const items = get().items.map((x) => (x.id === id ? { ...x, ...patch } : x));
    set({ items });
    await storage.saveHistory(items);
  },

  remove: async (id) => {
    const items = get().items.filter((x) => x.id !== id);
    set({ items });
    await storage.saveHistory(items);
  },

  clear: async () => {
    set({ items: [] });
    await storage.saveHistory([]);
  },
}));
