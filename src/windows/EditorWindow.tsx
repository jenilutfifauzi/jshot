import { useCallback, useRef, useState } from 'react';
import type Konva from 'konva';
import { Canvas } from '@/components/editor/Canvas';
import { Toolbar } from '@/components/editor/Toolbar';
import { Button } from '@/components/ui/button';
import { useScreenshotStore } from '@/stores/screenshotStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useHistoryStore } from '@/stores/historyStore';
import { tauriApi } from '@/services/tauri';
import { uploadImage } from '@/services/upload';
import { stageToDataUrl, dataUrlToBase64 } from '@/lib/canvas';
import { logger } from '@/lib/logger';
import { Copy, Save, Upload, Check, Loader2 } from 'lucide-react';

type ActionState = 'idle' | 'busy' | 'done';

export function EditorWindow() {
  const current = useScreenshotStore((s) => s.current);
  const setUploadUrl = useScreenshotStore((s) => s.setUploadUrl);
  const settings = useSettingsStore();
  const historyUpdate = useHistoryStore((s) => s.update);

  const stageRef = useRef<Konva.Stage | null>(null);
  const [copyState, setCopyState] = useState<ActionState>('idle');
  const [saveState, setSaveState] = useState<ActionState>('idle');
  const [uploadState, setUploadState] = useState<ActionState>('idle');
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const onStageReady = useCallback((stage: Konva.Stage) => {
    stageRef.current = stage;
  }, []);

  const exportDataUrl = useCallback((): string | null => {
    if (!stageRef.current) return null;
    return stageToDataUrl(stageRef.current, 1);
  }, []);

  const handleCopy = useCallback(async () => {
    const dataUrl = exportDataUrl();
    if (!dataUrl) return;
    setCopyState('busy');
    try {
      await tauriApi.copyImage(dataUrlToBase64(dataUrl));
      setCopyState('done');
      setTimeout(() => setCopyState('idle'), 1500);
    } catch (e) {
      logger.error('copy failed', e);
      setCopyState('idle');
    }
  }, [exportDataUrl]);

  const handleSave = useCallback(async () => {
    const dataUrl = exportDataUrl();
    if (!dataUrl) return;
    setSaveState('busy');
    try {
      const name = `jshot-${Date.now()}.png`;
      const path = await tauriApi.saveFile(dataUrlToBase64(dataUrl), name);
      if (path && current) {
        await historyUpdate(current.id, { filePath: path });
      }
      setSaveState('done');
      setTimeout(() => setSaveState('idle'), 1500);
    } catch (e) {
      logger.error('save failed', e);
      setSaveState('idle');
    }
  }, [exportDataUrl, current, historyUpdate]);

  const handleUpload = useCallback(async () => {
    const dataUrl = exportDataUrl();
    if (!dataUrl) return;
    setUploadState('busy');
    try {
      const res = await uploadImage({
        dataUrl,
        endpoint: settings.uploadEndpoint,
        apiKey: settings.apiKey,
      });
      setShareUrl(res.url);
      setUploadUrl(res.url);
      if (current) await historyUpdate(current.id, { uploadUrl: res.url, uploadStatus: 'done' });
      // auto-copy share link
      try {
        await navigator.clipboard.writeText(res.url);
      } catch {
        /* clipboard text may be blocked; ignore */
      }
      setUploadState('done');
    } catch (e) {
      logger.error('upload failed', e);
      setUploadState('idle');
    }
  }, [exportDataUrl, settings.uploadEndpoint, settings.apiKey, current, historyUpdate, setUploadUrl]);

  if (!current) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Waiting for capture…
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-muted/30">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-background px-3 py-2">
        <Toolbar />
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={handleCopy}>
            {copyState === 'done' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="ml-1">Copy</span>
          </Button>
          <Button size="sm" variant="secondary" onClick={handleSave}>
            {saveState === 'done' ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            <span className="ml-1">Save</span>
          </Button>
          <Button size="sm" onClick={handleUpload} disabled={uploadState === 'busy'}>
            {uploadState === 'busy' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : uploadState === 'done' ? (
              <Check className="h-4 w-4" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span className="ml-1">Upload</span>
          </Button>
        </div>
      </div>

      {shareUrl && (
        <div className="flex items-center gap-2 border-b border-border bg-green-50 px-3 py-1.5 text-sm dark:bg-green-950">
          <span className="text-muted-foreground">Link copied:</span>
          <a href={shareUrl} target="_blank" rel="noreferrer" className="text-primary underline">
            {shareUrl}
          </a>
        </div>
      )}

      <div className="flex flex-1 items-center justify-center overflow-auto p-4">
        <CanvasViewport onStageReady={onStageReady} />
      </div>
    </div>
  );
}

function CanvasViewport({ onStageReady }: { onStageReady: (s: Konva.Stage) => void }) {
  // Reserve space for the toolbar header (~56px) and padding.
  const maxWidth = Math.max(320, window.innerWidth - 48);
  const maxHeight = Math.max(240, window.innerHeight - 120);
  return <Canvas onStageReady={onStageReady} maxWidth={maxWidth} maxHeight={maxHeight} />;
}
