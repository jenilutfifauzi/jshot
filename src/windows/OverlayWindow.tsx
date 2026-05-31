import { useCallback, useEffect, useRef, useState } from 'react';
import { tauriApi } from '@/services/tauri';
import { logger } from '@/lib/logger';

interface Point {
  x: number;
  y: number;
}

/**
 * Fullscreen transparent overlay for drag-to-select region capture.
 * On mouse-up it asks Rust to capture that region, stashes the result for the
 * editor to pick up, opens the editor window, then closes itself.
 */
export function OverlayWindow() {
  const [start, setStart] = useState<Point | null>(null);
  const [end, setEnd] = useState<Point | null>(null);
  const dragging = useRef(false);

  useEffect(() => {
    document.body.classList.add('overlay-mode');
    return () => document.body.classList.remove('overlay-mode');
  }, []);

  // ESC cancels selection.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        void tauriApi.closeOverlay();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    setStart({ x: e.clientX, y: e.clientY });
    setEnd({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return;
    setEnd({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseUp = useCallback(async () => {
    dragging.current = false;
    if (!start || !end) return;

    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);

    if (width < 5 || height < 5) {
      // treated as a click; cancel.
      await tauriApi.closeOverlay();
      return;
    }

    // Account for devicePixelRatio so we capture native pixels, not CSS pixels.
    const dpr = window.devicePixelRatio || 1;
    const region = {
      x: Math.round(x * dpr),
      y: Math.round(y * dpr),
      width: Math.round(width * dpr),
      height: Math.round(height * dpr),
    };

    try {
      const res = await tauriApi.captureRegion(region);
      await tauriApi.setCapture(res);
      await tauriApi.openEditor(res.id);
    } catch (e) {
      logger.error('region capture failed', e);
    } finally {
      await tauriApi.closeOverlay();
    }
  }, [start, end]);

  const rect =
    start && end
      ? {
          left: Math.min(start.x, end.x),
          top: Math.min(start.y, end.y),
          width: Math.abs(end.x - start.x),
          height: Math.abs(end.y - start.y),
        }
      : null;

  return (
    <div
      className="fixed inset-0 cursor-crosshair select-none"
      style={{ background: 'rgba(0,0,0,0.25)' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {!rect && (
        <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 rounded-md bg-black/70 px-3 py-1.5 text-sm text-white">
          Drag to select an area · Esc to cancel
        </div>
      )}
      {rect && (
        <>
          {/* selection window (clear hole effect via border + transparent fill) */}
          <div
            className="absolute border-2 border-primary"
            style={{
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
              background: 'rgba(255,255,255,0.08)',
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.0)',
            }}
          />
          <div
            className="pointer-events-none absolute rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground"
            style={{ left: rect.left, top: Math.max(0, rect.top - 22) }}
          >
            {rect.width} × {rect.height}
          </div>
        </>
      )}
    </div>
  );
}
