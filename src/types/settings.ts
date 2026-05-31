export type ImageFormat = 'png' | 'jpg';
export type UploadProvider = 'custom' | 's3' | 'imgbb';
export type Theme = 'light' | 'dark' | 'system';

export interface AppSettings {
  shortcuts: {
    captureRegion: string;
    captureFullscreen: string;
  };
  saveDirectory: string;
  imageFormat: ImageFormat;
  jpgQuality: number;
  copyToClipboardAfterCapture: boolean;
  autoUpload: boolean;
  uploadProvider: UploadProvider;
  uploadEndpoint: string;
  apiKey: string | null;
  launchOnStartup: boolean;
  theme: Theme;
}

export const DEFAULT_SETTINGS: AppSettings = {
  shortcuts: {
    captureRegion: 'CmdOrCtrl+Shift+S',
    captureFullscreen: 'CmdOrCtrl+Shift+F',
  },
  saveDirectory: '',
  imageFormat: 'png',
  jpgQuality: 90,
  copyToClipboardAfterCapture: true,
  autoUpload: false,
  uploadProvider: 'custom',
  uploadEndpoint: '',
  apiKey: null,
  launchOnStartup: false,
  theme: 'system',
};
