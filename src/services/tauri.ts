import { invoke } from '@tauri-apps/api/core';
import type { CaptureResult, Region } from '@/types';

/** Typed wrappers around Rust commands. UI must call these, never invoke() directly. */
export const tauriApi = {
  captureFullscreen: () => invoke<CaptureResult>('capture_fullscreen'),

  captureRegion: (region: Region) =>
    invoke<CaptureResult>('capture_region', { region }),

  /** Opens the transparent overlay window for region selection. */
  openOverlay: () => invoke<void>('open_overlay'),

  closeOverlay: () => invoke<void>('close_overlay'),

  /** Opens the editor window with the captured image id. */
  openEditor: (captureId: string) =>
    invoke<void>('open_editor', { captureId }),

  /** Opens (or focuses) the history window. */
  openHistory: () => invoke<void>('open_history'),

  /** Opens (or focuses) the settings window. */
  openSettings: () => invoke<void>('open_settings'),

  /** Copy a PNG (base64, no data: prefix) to the system clipboard as an image. */
  copyImage: (pngBase64: string) =>
    invoke<void>('copy_image', { pngBase64 }),

  /** Save PNG bytes (base64) to disk. Returns the final path. */
  saveFile: (pngBase64: string, suggestedName: string) =>
    invoke<string>('save_file', { pngBase64, suggestedName }),

  /** Persisted capture handoff between windows (overlay -> editor). */
  getCapture: (id: string) => invoke<CaptureResult | null>('get_capture', { id }),
  setCapture: (capture: CaptureResult) => invoke<void>('set_capture', { capture }),
};
