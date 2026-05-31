import { useEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import type Konva from 'konva';
import { v4 as uuid } from 'uuid';
import { useScreenshotStore } from '@/stores/screenshotStore';
import { useEditorStore } from '@/stores/editorStore';
import { loadImage } from '@/lib/canvas';
import { AnnotationNode } from './AnnotationNode';
import type { Annotation } from '@/types';

interface DraftState {
  id: string;
  startX: number;
  startY: number;
}

interface CanvasProps {
  /** Called with the Stage ref so parent can export. */
  onStageReady?: (stage: Konva.Stage) => void;
  maxWidth: number;
  maxHeight: number;
}

export function Canvas({ onStageReady, maxWidth, maxHeight }: CanvasProps) {
  const current = useScreenshotStore((s) => s.current);
  const addAnnotation = useScreenshotStore((s) => s.addAnnotation);
  const updateAnnotation = useScreenshotStore((s) => s.updateAnnotation);
  const { tool, color, strokeWidth, fontSize } = useEditorStore();

  const stageRef = useRef<Konva.Stage>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const draft = useRef<DraftState | null>(null);
  const penPoints = useRef<number[]>([]);

  // Load screenshot bitmap into an HTMLImageElement for Konva.
  useEffect(() => {
    if (!current?.thumbnail) return;
    let alive = true;
    loadImage(current.thumbnail).then((el) => {
      if (alive) setImg(el);
    });
    return () => {
      alive = false;
    };
  }, [current?.thumbnail]);

  useEffect(() => {
    if (stageRef.current && onStageReady) onStageReady(stageRef.current);
  }, [onStageReady, img]);

  // Fit screenshot into the available viewport while preserving aspect ratio.
  const natW = current?.width ?? 0;
  const natH = current?.height ?? 0;
  const scale = natW && natH ? Math.min(maxWidth / natW, maxHeight / natH, 1) : 1;
  const dispW = natW * scale;
  const dispH = natH * scale;

  const toNative = useCallback(
    (px: number, py: number) => ({ x: px / scale, y: py / scale }),
    [scale],
  );

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (tool === 'select') return;
      const pos = e.target.getStage()?.getPointerPosition();
      if (!pos) return;
      const { x, y } = toNative(pos.x, pos.y);
      const id = uuid();

      if (tool === 'text') {
        const text = window.prompt('Text:');
        if (text) {
          addAnnotation({
            id,
            type: 'text',
            x,
            y,
            text,
            fontSize,
            color,
            strokeWidth,
            createdAt: Date.now(),
          });
        }
        return;
      }

      if (tool === 'pen') {
        penPoints.current = [x, y];
        addAnnotation({
          id,
          type: 'pen',
          points: [x, y],
          color,
          strokeWidth,
          createdAt: Date.now(),
        });
        draft.current = { id, startX: x, startY: y };
        return;
      }

      // shape tools: arrow/rectangle/circle/blur
      addAnnotation({
        id,
        type: tool,
        x,
        y,
        width: 0,
        height: 0,
        color,
        strokeWidth,
        createdAt: Date.now(),
        ...(tool === 'blur' ? { intensity: 8 } : {}),
      } as Annotation);
      draft.current = { id, startX: x, startY: y };
    },
    [tool, color, strokeWidth, fontSize, toNative, addAnnotation],
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!draft.current) return;
      const pos = e.target.getStage()?.getPointerPosition();
      if (!pos) return;
      const { x, y } = toNative(pos.x, pos.y);

      if (tool === 'pen') {
        penPoints.current = [...penPoints.current, x, y];
        updateAnnotation(draft.current.id, { points: penPoints.current } as Partial<Annotation>);
        return;
      }

      updateAnnotation(draft.current.id, {
        width: x - draft.current.startX,
        height: y - draft.current.startY,
      } as Partial<Annotation>);
    },
    [tool, toNative, updateAnnotation],
  );

  const handleMouseUp = useCallback(() => {
    draft.current = null;
    penPoints.current = [];
  }, []);

  if (!current) {
    return <div className="text-muted-foreground">No capture loaded.</div>;
  }

  return (
    <Stage
      ref={stageRef}
      width={dispW}
      height={dispH}
      scaleX={scale}
      scaleY={scale}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="rounded-md shadow-lg"
      style={{ cursor: tool === 'select' ? 'default' : 'crosshair' }}
    >
      <Layer>
        {img && <KonvaImage image={img} width={natW} height={natH} />}
      </Layer>
      <Layer>
        {current.annotations.map((a) => (
          <AnnotationNode key={a.id} a={a} />
        ))}
      </Layer>
    </Stage>
  );
}
