export interface Size {
  width: number; // 0 and more
  height: number; // 0 and more
}

export interface Placement {
  x: number; // 0 to width of canvas
  y: number; // 0 to height of canvas
}

export interface CanvasElementPlacement extends Placement {
  draggable: boolean;
}

export interface BaseStyle {
  fill: string; // color
  stroke: string; // color
  strokeWidth: number; // 0 and more
  dash: [dash: number, gap: number];

  opacity: number; // 0 to 1
  visible: boolean;

  shadowColor: string; // color
  shadowOffset: Placement; // any number
  shadowBlur: number; // 0 and more
  shadowOpacity: number; // 0 to 1

  rotation: number; // 0 to 360
  scaleX: number; // 1 or -1 for horizontal flip // to change size of path
  scaleY: number; // 1 or -1 for vertical flip // to change size of path
}

export const CanvasElementTypes = {
  Background: 'background',
  Rectangle: 'rectangle',
  Ellipse: 'ellipse', // + circle
  Polygon: 'polygon', // + triangle and pentagon
  Star: 'star',
  Line: 'line',
  Arrow: 'arrow',
  BrokenLine: 'brokenline',
  Tooltip: 'tooltip',
  Path: 'path', // heart
  Text: 'text',
  Draw: 'draw',
  Image: 'image',
  Group: 'group',
} as const;

export type CanvasElementType = typeof CanvasElementTypes;

export interface BaseCanvasElement extends CanvasElementPlacement, BaseStyle {
  id: string;
  type: CanvasElementType[keyof CanvasElementType];
  selected?: boolean;
}

export interface Background extends Pick<BaseCanvasElement, 'id' | 'type' | 'selected'>, Size {
  type: typeof CanvasElementTypes.Background;
  fill?: string;
  fillPatternImage?: string;
}

export interface Rectangle extends BaseCanvasElement, Size {
  type: typeof CanvasElementTypes.Rectangle;
  cornerRadius: [tl: number, tr: number, bl: number, br: number]; // 0 and more
}

export interface Ellipse extends BaseCanvasElement {
  type: typeof CanvasElementTypes.Ellipse;
  radiusX: number; // 0 and more
  radiusY: number; // 0 and more
}

export interface Polygon extends BaseCanvasElement {
  type: typeof CanvasElementTypes.Polygon;
  sides: number; // 3 and more
  radius: number; // 0 and more
}

export interface Star extends BaseCanvasElement {
  type: typeof CanvasElementTypes.Star;
  numPoints: number; // 2 and more
  innerRadius: number; // 0 and more
  outerRadius: number; // 0 and more
}

export interface Line extends BaseCanvasElement {
  type: typeof CanvasElementTypes.Line;
  points: [startX: number, startY: number, endX: number, endY: number];
}

export interface Arrow extends Omit<Line, 'type'> {
  type: typeof CanvasElementTypes.Arrow;
  pointerLength: number; // 0 and more
  pointerWidth: number; // 0 and more
}

export const LineCapTypes = {
  Round: 'round',
  Butt: 'butt',
} as const;

export type LineCapType = typeof LineCapTypes;

export const LineJoinTypes = {
  Round: 'round',
  Miter: 'miter',
} as const;

export type LineJoinType = typeof LineJoinTypes;

export interface BrokenLine extends BaseCanvasElement {
  type: typeof CanvasElementTypes.Line;
  points: number[];
  tension: number; // 0 to 1
  closed: boolean;
}

export const DirectionTypes = {
  Up: 'up',
  Down: 'down',
  Left: 'left',
  Right: 'right',
} as const;

export type DirectionType = typeof DirectionTypes;

export interface Tooltip extends BaseCanvasElement {
  type: typeof CanvasElementTypes.Tooltip;
  pointerDirection: DirectionType[keyof DirectionType];
  pointerWidth: number;
  pointerHeight: number;
}

export interface Path extends BaseCanvasElement {
  type: typeof CanvasElementTypes.Path;
  data: string;
}

export const AlignmentTypes = {
  Left: 'left',
  Center: 'center',
  Right: 'right',
} as const;

export type AlignmentType = typeof AlignmentTypes;

export interface Text extends BaseCanvasElement, Size {
  type: typeof CanvasElementTypes.Text;
  text: string;
  fontSize: number; // 1 and more
  fontFamily: string;
  padding: number; // 0 and more
  align: AlignmentType[keyof AlignmentType];
}

export const BrushTypes = {
  Pencil: 'pencil',
  Marker: 'marker',
} as const;

export type BrushType = typeof BrushTypes;

export interface BaseDraw extends BaseCanvasElement {
  type: typeof CanvasElementTypes.Draw;
  points: number[];
  brushType: BrushType[keyof BrushType];
  lineCap: string;
  lineJoin: typeof LineJoinTypes.Round;
}

export interface Pencil extends BaseDraw {
  brushType: typeof BrushTypes.Pencil;
}

export interface Marker extends BaseDraw {
  brushType: typeof BrushTypes.Marker;
}

export interface Image extends Omit<Rectangle, 'type'> {
  type: typeof CanvasElementTypes.Image;
  image: string;
}

export interface Group extends BaseCanvasElement, Size {
  type: typeof CanvasElementTypes.Group;
  children: CanvasElement[];
}

export type CanvasElement =
  | Background
  | Rectangle
  | Ellipse
  | Polygon
  | Star
  | Line
  | BrokenLine
  | Arrow
  | Tooltip
  | Path
  | Text
  | BaseDraw
  | Image
  | Group;

export interface ImageItem {
  id: string;
  url: string;
  urlSource: 'local' | 'server';
  file?: File;
  deleted: boolean;
}

export interface Canvas {
  background: Background;
  layers: CanvasElement[];
  images: { [imageId: string]: string[] };
}
