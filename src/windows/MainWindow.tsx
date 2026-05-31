import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { tauriApi } from '@/services/tauri';
import { captureController } from '@/services/captureController';
import { useScreenshotStore } from '@/stores/screenshotStore';
import { Camera, Crop, History, Settings as SettingsIcon } from 'lucide-react';
import { logger } from '@/lib/logger';

export function MainWindow() {
  const isCapturing = useScreenshotStore((s) => s.isCapturing);
  const error = useScreenshotStore((s) => s.error);

  const handleRegion = useCallback(async () => {
    try {
      await tauriApi.openOverlay();
    } catch (e) {
      logger.error('open overlay failed', e);
    }
  }, []);

  const handleFullscreen = useCallback(async () => {
    const res = await captureController.fullscreen();
    if (res) {
      try {
        await tauriApi.setCapture(res);
        await tauriApi.openEditor(res.id);
      } catch (e) {
        logger.error('open editor failed', e);
      }
    }
  }, []);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-background p-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">JShot</h1>
        <p className="text-sm text-muted-foreground">Fast screenshots, annotate &amp; share</p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button onClick={handleRegion} disabled={isCapturing} className="gap-2">
          <Crop className="h-4 w-4" /> Capture Region
        </Button>
        <Button onClick={handleFullscreen} disabled={isCapturing} variant="secondary" className="gap-2">
          <Camera className="h-4 w-4" /> Capture Fullscreen
        </Button>

        <div className="mt-2 flex gap-2">
          <Button
            variant="ghost"
            className="flex-1 gap-2"
            onClick={() => void tauriApi.openHistory()}
          >
            <History className="h-4 w-4" /> History
          </Button>
          <Button
            variant="ghost"
            className="flex-1 gap-2"
            onClick={() => void tauriApi.openSettings()}
          >
            <SettingsIcon className="h-4 w-4" /> Settings
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <p className="text-xs text-muted-foreground">
        Tip: press your global shortcut to capture from anywhere.
      </p>
    </div>
  );
}
