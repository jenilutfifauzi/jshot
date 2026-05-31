import { useEffect, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { MainWindow } from '@/windows/MainWindow';
import { OverlayWindow } from '@/windows/OverlayWindow';
import { EditorWindow } from '@/windows/EditorWindow';
import { HistoryWindow } from '@/windows/HistoryWindow';
import { SettingsWindow } from '@/windows/SettingsWindow';
import { useScreenshotStore } from '@/stores/screenshotStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { tauriApi } from '@/services/tauri';
import {
  onTriggerCaptureFullscreen,
  onTriggerCaptureRegion,
} from '@/services/events';
import { captureController } from '@/services/captureController';
import { logger } from '@/lib/logger';

/**
 * Single bundle, multi-window app. The Rust core creates windows with labels
 * (main/overlay/editor/history/settings); we render the matching React tree.
 */
export default function App() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    try {
      setLabel(getCurrentWindow().label);
    } catch (e) {
      logger.warn('not in tauri window context, defaulting to main', e);
      setLabel('main');
    }
  }, []);

  if (label === null) return null;

  switch (label) {
    case 'overlay':
      return <OverlayWindow />;
    case 'editor':
      return <EditorBootstrap />;
    case 'history':
      return <HistoryWindow />;
    case 'settings':
      return <SettingsWindow />;
    case 'main':
    default:
      return <MainBootstrap />;
  }
}

/** Main window: load settings + wire global-shortcut event listeners. */
function MainBootstrap() {
  const loadSettings = useSettingsStore((s) => s.load);

  useEffect(() => {
    void loadSettings();

    const unlisteners: Array<Promise<() => void>> = [];

    unlisteners.push(
      onTriggerCaptureRegion(async () => {
        try {
          await tauriApi.openOverlay();
        } catch (e) {
          logger.error('shortcut: open overlay failed', e);
        }
      }),
    );

    unlisteners.push(
      onTriggerCaptureFullscreen(async () => {
        const res = await captureController.fullscreen();
        if (res) {
          await tauriApi.setCapture(res);
          await tauriApi.openEditor(res.id);
        }
      }),
    );

    return () => {
      unlisteners.forEach((p) => p.then((un) => un()).catch(() => {}));
    };
  }, [loadSettings]);

  return <MainWindow />;
}

/** Editor window: pull the stashed capture from Rust into the store on mount. */
function EditorBootstrap() {
  const setFromCapture = useScreenshotStore((s) => s.setFromCapture);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('captureId');
    (async () => {
      try {
        if (id) {
          const cap = await tauriApi.getCapture(id);
          if (cap) setFromCapture(cap);
        }
      } catch (e) {
        logger.error('editor bootstrap failed', e);
      } finally {
        setReady(true);
      }
    })();
  }, [setFromCapture]);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Loading editor…
      </div>
    );
  }
  return <EditorWindow />;
}
