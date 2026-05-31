import type { Annotation } from './annotation';

export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

export interface ScreenshotItem {
  id: string;
  filePath: string | null;
  thumbnail: string | null; // data URL (PNG)
  width: number;
  height: number;
  annotations: Annotation[];
  createdAt: number;
  uploadUrl: string | null;
  uploadStatus: UploadStatus;
}

/** Hasil capture dari Rust */
export interface CaptureResult {
  id: string;
  width: number;
  height: number;
  dataUrl: string;
}
