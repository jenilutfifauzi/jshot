export type AnnotationType =
  | 'arrow'
  | 'rectangle'
  | 'circle'
  | 'text'
  | 'blur'
  | 'pen';

export interface BaseAnnotation {
  id: string;
  type: AnnotationType;
  color: string;
  strokeWidth: number;
  createdAt: number;
}

export interface ShapeAnnotation extends BaseAnnotation {
  type: 'arrow' | 'rectangle' | 'circle';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
}

export interface PenAnnotation extends BaseAnnotation {
  type: 'pen';
  points: number[]; // [x1,y1,x2,y2,...]
}

export interface BlurAnnotation extends BaseAnnotation {
  type: 'blur';
  x: number;
  y: number;
  width: number;
  height: number;
  intensity: number;
}

export type Annotation =
  | ShapeAnnotation
  | TextAnnotation
  | PenAnnotation
  | BlurAnnotation;
