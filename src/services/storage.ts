import {
  readTextFile,
  writeTextFile,
  exists,
  mkdir,
  BaseDirectory,
} from '@tauri-apps/plugin-fs';
import type { ScreenshotItem, AppSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';
import { logger } from '@/lib/logger';

const HISTORY_FILE = 'history.json';
const SETTINGS_FILE = 'settings.json';
const DIR = BaseDirectory.AppData;

async function ensureDir() {
  try {
    if (!(await exists('', { baseDir: DIR }))) {
      await mkdir('', { baseDir: DIR, recursive: true });
    }
  } catch (e) {
    logger.warn('ensureDir failed (may already exist)', e);
  }
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    if (!(await exists(file, { baseDir: DIR }))) return fallback;
    const txt = await readTextFile(file, { baseDir: DIR });
    return JSON.parse(txt) as T;
  } catch (e) {
    logger.error(`readJson ${file} failed`, e);
    return fallback;
  }
}

async function writeJson<T>(file: string, data: T): Promise<void> {
  await ensureDir();
  await writeTextFile(file, JSON.stringify(data, null, 2), { baseDir: DIR });
}

export const storage = {
  loadHistory: () => readJson<ScreenshotItem[]>(HISTORY_FILE, []),
  saveHistory: (items: ScreenshotItem[]) => writeJson(HISTORY_FILE, items),

  loadSettings: async (): Promise<AppSettings> => {
    const loaded = await readJson<Partial<AppSettings>>(SETTINGS_FILE, {});
    return { ...DEFAULT_SETTINGS, ...loaded };
  },
  saveSettings: (settings: AppSettings) => writeJson(SETTINGS_FILE, settings),
};
