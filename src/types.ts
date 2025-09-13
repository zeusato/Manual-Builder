export type ShapeType = 'rect' | 'circle' | 'line' | 'arrow';

export interface Shape {
  id: string;
  type: ShapeType;
  color: string;
  x1: number; y1: number;
  x2: number; y2: number;
}

export interface Shot {
  id: string;
  src: string;            // ảnh gốc (import)
  annotatedSrc?: string;  // ảnh đã bake sau mỗi thao tác vẽ
  compositeSrc?: string;  // ảnh đã ghép vào mockup (dùng cho Pages Preview)
  description: string;
  shapes: Shape[];
}

export type PageSizeKey = 'A4_P' | 'A4_L' | 'HD_16_9';

export interface PagePreset {
  key: PageSizeKey;
  label: string;
  width: number;
  height: number;
  maxCols: number;
  maxRows: number;
}
