import {
  Alignments,
  type BaseStyle,
  BrushTypes,
  CanvasElements,
  Directions,
  LineCaps,
  LineJoins,
} from '@mytypes/editorTypes';

export const ERROR_TYPES = {
  SNR: 'Unable to connect to the server. Please try again later',
  OFL: 'You are offline. Please check your internet connection',
  SWW: 'Something went wrong',
};

export const DEFAULT_PROJECT_LIST_LIMIT = 10;
export const AUTOSAVE_DELAY = 7000;
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MIN_CANVAS_SIZE = 40;
export const MAX_CANVAS_SIZE = 4000;
export const DEFAULT_CANVAS_SIZE = 1080;
export const MIN_SCALE = 0.1;
export const MAX_SCALE = 5;
export const SCALE_FACTOR = 1.05;
export const DEFAULT_BORDER_COLOR = '#4069a9';
export const SUPPORTED_UPLOADS = ['image/png', 'image/jpeg'];

export const DEFAULT_FILL_COLOR = '#eaeaea';
export const DEFAULT_STROKE_COLOR = '#0f1314';
export const DEFAULT_ELEMENT_SIZE = 76;

export const FONT_FAMILIES = [
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: '"Times New Roman", Times, serif', label: 'Times New Roman' },
  { value: '"Courier New", Courier, monospace', label: 'Courier New' },
  { value: '"Amatic SC", sans-serif', label: 'Amatic SC' },
  { value: '"Bebas Neue", sans-serif', label: 'Bebas Neue' },
  { value: '"Berkshire Swash", sans-serif', label: 'Berkshire Swash' },
  { value: 'Cairo, sans-serif', label: 'Cairo' },
  { value: 'Goldman, sans-serif', label: 'Goldman' },
  { value: '"Google Sans Flex", sans-serif', label: 'Google Sans Flex' },
  { value: '"Gravitas One", serif', label: 'Gravitas One' },
  { value: '"Josefin Sans", sans-serif', label: 'Josefin Sans' },
  { value: 'Lobster, sans-serif', label: 'Lobster' },
  { value: 'Nunito, sans-serif', label: 'Nunito' },
  { value: 'Oswald, sans-serif', label: 'Oswald' },
  { value: 'Pacifico, cursive', label: 'Pacifico' },
  { value: '"Playfair Display", serif', label: 'Playfair Display' },
  { value: '"Playwrite GB S", cursive', label: 'Playwrite GB S' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: '"Roboto Slab", serif', label: 'Roboto Slab' },
  { value: '"Shadows Into Light", cursive', label: 'Shadows Into Light' },
] as const;

export const BASE_STYLE: BaseStyle = {
  fill: DEFAULT_FILL_COLOR,
  stroke: DEFAULT_STROKE_COLOR,
  strokeWidth: 0,
  visible: true,
  opacity: 1,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
};

const BASE_STYLE_LINE = {
  ...BASE_STYLE,
  fill: 'transparent',
  strokeWidth: 1,
};

export const DEFAULT_PROPS = {
  [CanvasElements.Background]: {
    id: CanvasElements.Background,
    type: CanvasElements.Background,
    fill: 'transparent',
  },
  [CanvasElements.Rectangle]: {
    type: CanvasElements.Rectangle,
    width: DEFAULT_ELEMENT_SIZE,
    height: DEFAULT_ELEMENT_SIZE,
    cornerRadius: [0, 0, 0, 0] as [number, number, number, number],
    ...BASE_STYLE,
  },
  [CanvasElements.Ellipse]: {
    type: CanvasElements.Ellipse,
    radiusX: DEFAULT_ELEMENT_SIZE / 2,
    radiusY: DEFAULT_ELEMENT_SIZE / 2,
    ...BASE_STYLE,
  },
  [CanvasElements.Triangle]: {
    type: CanvasElements.Triangle,
    sides: 3,
    radius: DEFAULT_ELEMENT_SIZE / 2,
    ...BASE_STYLE,
  },
  [CanvasElements.Pentagon]: {
    type: CanvasElements.Pentagon,
    sides: 5,
    radius: DEFAULT_ELEMENT_SIZE / 2,
    ...BASE_STYLE,
  },
  [CanvasElements.Polygon]: {
    type: CanvasElements.Polygon,
    sides: 6,
    radius: DEFAULT_ELEMENT_SIZE / 2,
    ...BASE_STYLE,
  },
  [CanvasElements.Star]: {
    type: CanvasElements.Star,
    numPoints: 5,
    innerRadius: DEFAULT_ELEMENT_SIZE / 4,
    outerRadius: DEFAULT_ELEMENT_SIZE / 2,
    ...BASE_STYLE,
  },
  [CanvasElements.Line]: {
    type: CanvasElements.Line,
    points: [0, 0, DEFAULT_ELEMENT_SIZE, 0] as [number, number, number, number],
    ...BASE_STYLE_LINE,
  },
  [CanvasElements.Arrow]: {
    type: CanvasElements.Arrow,
    points: [0, 0, DEFAULT_ELEMENT_SIZE, 0] as [number, number, number, number],
    pointerLength: 10,
    pointerWidth: 10,
    ...BASE_STYLE_LINE,
  },
  [CanvasElements.Tooltip]: {
    type: CanvasElements.Tooltip,
    pointerDirection: Directions.Up,
    pointerWidth: 20,
    pointerHeight: 10,
    ...BASE_STYLE,
  },
  [CanvasElements.Text]: {
    type: CanvasElements.Text,
    width: DEFAULT_ELEMENT_SIZE * 2,
    height: DEFAULT_ELEMENT_SIZE / 2,
    text: 'Some text',
    isEmpty: true,
    fontSize: 16,
    fontFamily: FONT_FAMILIES[0].value,
    padding: 0,
    align: Alignments.Left,
    ...BASE_STYLE,
    fill: DEFAULT_STROKE_COLOR,
  },
  [CanvasElements.Drawing]: {
    type: CanvasElements.Drawing,
    x: 0,
    y: 0,
    ...BASE_STYLE,
    fill: 'transparent',
  },
  [CanvasElements.Image]: {
    type: CanvasElements.Image,
    width: DEFAULT_ELEMENT_SIZE,
    height: DEFAULT_ELEMENT_SIZE,
    cornerRadius: [0, 0, 0, 0] as [number, number, number, number],
    ...BASE_STYLE,
    fill: 'transparent',
  },
};

export const DEFAULT_BRUSH_PROPS = {
  [BrushTypes.Pencil]: {
    brushType: BrushTypes.Pencil,
    lineCap: LineCaps.Round,
    lineJoin: LineJoins.Round,
    strokeWidth: 2,
    opacity: 1,
    tension: 0.5,
    shadowBlur: 0,
  },
  [BrushTypes.Marker]: {
    brushType: BrushTypes.Marker,
    lineCap: LineCaps.Square,
    lineJoin: LineJoins.Bevel,
    strokeWidth: 16,
    opacity: 0.35,
    tension: 0.4,
    shadowBlur: 0,
  },
  [BrushTypes.Brush]: {
    brushType: BrushTypes.Brush,
    lineCap: LineCaps.Round,
    lineJoin: LineJoins.Round,
    strokeWidth: 10,
    opacity: 1,
    tension: 0.5,
    shadowBlur: 3,
  },
  [BrushTypes.Eraser]: {
    brushType: BrushTypes.Eraser,
    lineCap: LineCaps.Round,
    lineJoin: LineJoins.Round,
    strokeWidth: 18,
    opacity: 1,
    tension: 0.5,
    shadowBlur: 0,
    globalCompositeOperation: 'destination-out' as GlobalCompositeOperation,
  },
};

export const SIZE_TYPES = [
  { width: null, height: null },
  { width: 1080, height: 1080, proportion: '1:1' },
  { width: 1080, height: 1920, proportion: '9:16' },
  { width: 1080, height: 1350, proportion: '4:5' },
  { width: 1920, height: 1080, proportion: '16:9' },
  { width: 1350, height: 1080, proportion: '5:4' },
];

export const TEMPLATE_TYPES = [
  { value: 'other', label: 'Other' },
  { value: 'collage', label: 'Collage' },
  { value: 'facebook-post', label: 'Facebook Post' },
  { value: 'facebook-story', label: 'Facebook Story' },
  { value: 'invitation', label: 'Invitation' },
  { value: 'pinterest-pin', label: 'Pinterest Pin' },
  { value: 'resume', label: 'Resume' },
] as const;

export const VISIBILITY_TYPES = [
  { value: 'me', label: 'Only me' },
  { value: 'everyone', label: 'Everyone with link' },
] as const;

export const EXPORT_TYPES = [
  { value: 'png', label: 'PNG' },
  { value: 'jpg', label: 'JPG' },
  { value: 'pdf', label: 'PDF' },
  { value: 'webp', label: 'WebP' },
] as const;
