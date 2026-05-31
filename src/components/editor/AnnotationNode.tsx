import { Arrow, Rect, Circle, Text, Line } from 'react-konva';
import type { Annotation } from '@/types';

export function AnnotationNode({ a }: { a: Annotation }) {
  switch (a.type) {
    case 'arrow':
      return (
        <Arrow
          points={[a.x, a.y, a.x + a.width, a.y + a.height]}
          stroke={a.color}
          fill={a.color}
          strokeWidth={a.strokeWidth}
          pointerLength={10}
          pointerWidth={10}
        />
      );
    case 'rectangle':
      return (
        <Rect
          x={a.x}
          y={a.y}
          width={a.width}
          height={a.height}
          stroke={a.color}
          strokeWidth={a.strokeWidth}
        />
      );
    case 'circle':
      return (
        <Circle
          x={a.x + a.width / 2}
          y={a.y + a.height / 2}
          radiusX={Math.abs(a.width / 2)}
          radiusY={Math.abs(a.height / 2)}
          stroke={a.color}
          strokeWidth={a.strokeWidth}
        />
      );
    case 'text':
      return (
        <Text
          x={a.x}
          y={a.y}
          text={a.text}
          fontSize={a.fontSize}
          fill={a.color}
        />
      );
    case 'pen':
      return (
        <Line
          points={a.points}
          stroke={a.color}
          strokeWidth={a.strokeWidth}
          lineCap="round"
          lineJoin="round"
          tension={0.4}
        />
      );
    case 'blur':
      // MVP: represent blur as a semi-opaque box; true pixel blur done on export in Rust (v0.2).
      return (
        <Rect
          x={a.x}
          y={a.y}
          width={a.width}
          height={a.height}
          fill="rgba(0,0,0,0.35)"
        />
      );
    default:
      return null;
  }
}
