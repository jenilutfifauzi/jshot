import { tauriApi } from '@/services/tauri';
import { useScreenshotStore } from '@/stores/screenshotStore';
import { useHistoryStore } from '@/stores/historyStore';
import { logger } from '@/lib/logger';
import type { CaptureResult, Region } from '@/types';

/**
 * Central capture orchestration. Keeps UI components free of invoke() calls.
 */
export const captureController = {
  async fullscreen(): Promise<CaptureResult | null> {
    const store = useScreenshotStore.getState();
    store.setCapturing(true);
    store.setError(null);
    try {
      const res = await tauriApi.captureFullscreen();
      store.setFromCapture(res);
      await captureController.persist(res);
      return res;
    } catch (e) {
      logger.error('fullscreen capture failed', e);
      store.setError(String(e));
      return null;
    } finally {
      store.setCapturing(false);
    }
  },

  async region(region: Region): Promise<CaptureResult | null> {
    const store = useScreenshotStore.getState();
    store.setCapturing(true);
    store.setError(null);
    try {
      const res = await tauriApi.captureRegion(region);
      store.setFromCapture(res);
      await captureController.persist(res);
      return res;
    } catch (e) {
      logger.error('region capture failed', e);
      store.setError(String(e));
      return null;
    } finally {
      store.setCapturing(false);
    }
  },

  /** Record a freshly captured (un-annotated) item into history. */
  async persist(res: CaptureResult) {
    try {
      await useHistoryStore.getState().add({
        id: res.id,
        filePath: null,
        thumbnail: res.dataUrl,
        width: res.width,
        height: res.height,
        annotations: [],
        createdAt: Date.now(),
        uploadUrl: null,
        uploadStatus: 'idle',
      });
    } catch (e) {
      logger.warn('persist to history failed', e);
    }
  },
};
