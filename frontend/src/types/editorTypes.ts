import type Konva from 'konva';

export interface Size {
  width: number; // 0 and more
  height: number; // 0 and more
}

export interface Placement {
  x: number; // any
  y: number; // any
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
  shadowOffset: Placement; // any
  shadowBlur: number; // 0 and more
  shadowOpacity: number; // 0 to 1

  rotation: number; // 0 to 360
  scaleX: number; // 1 or -1 for horizontal flip // to change size of path
  scaleY: number; // 1 or -1 for vertical flip // to change size of path
}

export const CanvasElements = {
  Background: 'background',
  Rectangle: 'rectangle',
  Ellipse: 'ellipse', // + circle
  Polygon: 'polygon', // + triangle and pentagon
  Star: 'star',
  Line: 'line',
  Arrow: 'arrow',
  BrokenLine: 'broken line',
  Tooltip: 'tooltip',
  Path: 'path', // heart
  Text: 'text',
  Drawing: 'drawing',
  Image: 'image',
  Group: 'group',
} as const;

export type CanvasElementType = (typeof CanvasElements)[keyof typeof CanvasElements];

export interface BaseCanvasElement extends CanvasElementPlacement, BaseStyle {
  id: string;
  type: CanvasElementType;
  selected?: boolean;
  order: number;
}

export interface Background extends Pick<BaseCanvasElement, 'id' | 'type' | 'selected'>, Size {
  type: typeof CanvasElements.Background;
  fill?: string;
  image?: string;
}

export interface Rectangle extends BaseCanvasElement, Size {
  type: typeof CanvasElements.Rectangle;
  cornerRadius: [tl: number, tr: number, bl: number, br: number]; // 0 and more
}

export interface Ellipse extends BaseCanvasElement {
  type: typeof CanvasElements.Ellipse;
  radiusX: number; // 0 and more
  radiusY: number; // 0 and more
}

export interface Polygon extends BaseCanvasElement {
  type: typeof CanvasElements.Polygon;
  sides: number; // 3 and more
  radius: number; // 0 and more
}

export interface Star extends BaseCanvasElement {
  type: typeof CanvasElements.Star;
  numPoints: number; // 2 and more
  innerRadius: number; // 0 and more
  outerRadius: number; // 0 and more
}

export interface Line extends BaseCanvasElement {
  type: typeof CanvasElements.Line;
  points: [startX: number, startY: number, endX: number, endY: number];
}

export interface Arrow extends Omit<Line, 'type'> {
  type: typeof CanvasElements.Arrow;
  pointerLength: number; // 0 and more
  pointerWidth: number; // 0 and more
}

export const LineCaps = {
  Round: 'round',
  Butt: 'butt',
} as const;

export type LineCap = (typeof LineCaps)[keyof typeof LineCaps];

export const LineJoins = {
  Round: 'round',
  Miter: 'miter',
} as const;

export type LineJoin = (typeof LineJoins)[keyof typeof LineJoins];

export interface BrokenLine extends BaseCanvasElement {
  type: typeof CanvasElements.Line;
  points: number[];
  tension: number; // 0 to 1
  closed: boolean;
}

export const Directions = {
  Up: 'up',
  Down: 'down',
  Left: 'left',
  Right: 'right',
} as const;

export type Direction = (typeof Directions)[keyof typeof Directions];

export interface Tooltip extends BaseCanvasElement {
  type: typeof CanvasElements.Tooltip;
  pointerDirection: Direction;
  pointerWidth: number;
  pointerHeight: number;
}

export interface Path extends BaseCanvasElement {
  type: typeof CanvasElements.Path;
  data: string;
}

export const Alignments = {
  Left: 'left',
  Center: 'center',
  Right: 'right',
} as const;

export type Alignment = (typeof Alignments)[keyof typeof Alignments];

export interface Text extends BaseCanvasElement, Size {
  type: typeof CanvasElements.Text;
  text: string;
  fontSize: number; // 1 and more
  fontFamily: string;
  padding: number; // 0 and more
  align: Alignment;
}

export const BrushTypes = {
  Pencil: 'pencil',
  Marker: 'marker',
} as const;

export type BrushType = (typeof BrushTypes)[keyof typeof BrushTypes];

export interface BaseDraw extends BaseCanvasElement {
  type: typeof CanvasElements.Drawing;
  points: number[];
  brushType: BrushType;
  lineCap: LineCap;
  lineJoin: typeof LineJoins.Round;
}

export interface Pencil extends BaseDraw {
  brushType: typeof BrushTypes.Pencil;
}

export interface Marker extends BaseDraw {
  brushType: typeof BrushTypes.Marker;
}

export interface Image extends Omit<Rectangle, 'type'> {
  type: typeof CanvasElements.Image;
  image: Image;
}

export interface Group extends BaseCanvasElement, Size {
  type: typeof CanvasElements.Group;
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

export interface CanvasProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  backgroundRef: React.RefObject<Konva.Rect | null>;
}

export const Tools = {
  Select: 'select',
  Grab: 'grab',
} as const;

export type Tool = (typeof Tools)[keyof typeof Tools];

export const Modes = {
  Edit: 'edit',
  View: 'view',
  Load: 'load',
} as const;

export type Mode = (typeof Modes)[keyof typeof Modes];

export const Actions = {
  Add: 'Added',
  Move: 'Moved',
  Resize: 'Resized',
  Fill: 'Changed fill of',
  Stroke: 'Changed stroke of',
  Shadow: 'Changed shadow of',
  Font: 'Changed font of',
  Delete: 'Deleted',
} as const;

export type Action = (typeof Actions)[keyof typeof Actions];
