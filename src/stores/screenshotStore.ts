import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { ScreenshotItem, Annotation, CaptureResult } from '@/types';

interface ScreenshotState {
  current: ScreenshotItem | null;
  isCapturing: boolean;
  error: string | null;

  setCapturing: (v: boolean) => void;
  setError: (e: string | null) => void;
  setFromCapture: (res: CaptureResult) => void;
  addAnnotation: (a: Annotation) => void;
  updateAnnotation: (id: string, patch: Partial<Annotation>) => void;
  removeAnnotation: (id: string) => void;
  setUploadUrl: (url: string) => void;
  reset: () => void;
}

export const useScreenshotStore = create<ScreenshotState>((set) => ({
  current: null,
  isCapturing: false,
  error: null,

  setCapturing: (v) => set({ isCapturing: v }),
  setError: (e) => set({ error: e }),

  setFromCapture: (res) =>
    set({
      current: {
        id: res.id || uuid(),
        filePath: null,
        thumbnail: res.dataUrl,
        width: res.width,
        height: res.height,
        annotations: [],
        createdAt: Date.now(),
        uploadUrl: null,
        uploadStatus: 'idle',
      },
      error: null,
    }),

  addAnnotation: (a) =>
    set((s) =>
      s.current
        ? { current: { ...s.current, annotations: [...s.current.annotations, a] } }
        : s,
    ),

  updateAnnotation: (id, patch) =>
    set((s) =>
      s.current
        ? {
            current: {
              ...s.current,
              annotations: s.current.annotations.map((x) =>
                x.id === id ? ({ ...x, ...patch } as Annotation) : x,
              ),
            },
          }
        : s,
    ),

  removeAnnotation: (id) =>
    set((s) =>
      s.current
        ? {
            current: {
              ...s.current,
              annotations: s.current.annotations.filter((x) => x.id !== id),
            },
          }
        : s,
    ),

  setUploadUrl: (url) =>
    set((s) =>
      s.current
        ? { current: { ...s.current, uploadUrl: url, uploadStatus: 'done' } }
        : s,
    ),

  reset: () => set({ current: null, error: null, isCapturing: false }),
}));
