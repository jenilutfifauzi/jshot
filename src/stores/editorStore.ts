import { create } from 'zustand';
import type { AnnotationType } from '@/types';

export type Tool = AnnotationType | 'select';

interface EditorState {
  tool: Tool;
  color: string;
  strokeWidth: number;
  fontSize: number;
  selectedId: string | null;

  setTool: (t: Tool) => void;
  setColor: (c: string) => void;
  setStrokeWidth: (w: number) => void;
  setFontSize: (s: number) => void;
  setSelectedId: (id: string | null) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  tool: 'select',
  color: '#ef4444',
  strokeWidth: 3,
  fontSize: 20,
  selectedId: null,

  setTool: (t) => set({ tool: t, selectedId: null }),
  setColor: (c) => set({ color: c }),
  setStrokeWidth: (w) => set({ strokeWidth: w }),
  setFontSize: (s) => set({ fontSize: s }),
  setSelectedId: (id) => set({ selectedId: id }),
}));
