import { useEditorStore } from '@/stores/editorStore';
import type { AnnotationType } from '@/types';
import { cn } from '@/lib/utils';
import {
  MousePointer2,
  ArrowUpRight,
  Square,
  Circle as CircleIcon,
  Type,
  Pencil,
  Droplet,
} from 'lucide-react';

type ToolDef = { id: AnnotationType | 'select'; label: string; icon: React.ReactNode };

const TOOLS: ToolDef[] = [
  { id: 'select', label: 'Select', icon: <MousePointer2 className="h-4 w-4" /> },
  { id: 'arrow', label: 'Arrow', icon: <ArrowUpRight className="h-4 w-4" /> },
  { id: 'rectangle', label: 'Rectangle', icon: <Square className="h-4 w-4" /> },
  { id: 'circle', label: 'Circle', icon: <CircleIcon className="h-4 w-4" /> },
  { id: 'text', label: 'Text', icon: <Type className="h-4 w-4" /> },
  { id: 'pen', label: 'Pen', icon: <Pencil className="h-4 w-4" /> },
  { id: 'blur', label: 'Blur', icon: <Droplet className="h-4 w-4" /> },
];

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#000000', '#ffffff'];

export function Toolbar() {
  const { tool, setTool, color, setColor, strokeWidth, setStrokeWidth } = useEditorStore();

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-background/95 p-1 shadow-md backdrop-blur">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          title={t.label}
          onClick={() => setTool(t.id)}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
            tool === t.id
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent hover:text-accent-foreground',
          )}
        >
          {t.icon}
        </button>
      ))}

      <div className="mx-1 h-6 w-px bg-border" />

      <div className="flex items-center gap-1">
        {COLORS.map((c) => (
          <button
            key={c}
            title={c}
            onClick={() => setColor(c)}
            className={cn(
              'h-5 w-5 rounded-full border',
              color === c ? 'ring-2 ring-offset-1 ring-primary' : 'border-border',
            )}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <div className="mx-1 h-6 w-px bg-border" />

      <input
        type="range"
        min={1}
        max={12}
        value={strokeWidth}
        onChange={(e) => setStrokeWidth(Number(e.target.value))}
        title={`Stroke: ${strokeWidth}px`}
        className="w-20 accent-primary"
      />
    </div>
  );
}
