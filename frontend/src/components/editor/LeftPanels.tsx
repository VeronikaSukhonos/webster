import clsx from 'clsx';

import { reorderCanvasElements, selectEditor, setSelectedIds } from '@store/editorSlice';

import { MainButton } from '@components/MainButton';

import arrow from '@assets/arrow.png';
import ellipse from '@assets/ellipse.png';
import {
  ArrowIcon,
  ArrowShape,
  BrushIcon,
  EllipseShape,
  ImageIcon,
  LayerIcon,
  LineShape,
  MarkerIcon,
  PencilIcon,
  PentagonShape,
  PolygonShape,
  RectangleShape,
  StarShape,
  TextIcon,
  TriangleShape,
} from '@assets/index';
import line from '@assets/line.png';
import pentagon from '@assets/pentagon.png';
import polygon from '@assets/polygon.png';
import rectangle from '@assets/rectangle.png';
import star from '@assets/star.png';
// import tooltip from '@assets/tooltip.png';
import triangle from '@assets/triangle.png';

import { useAppDispatch, useAppSelector } from '@hooks/utilHooks';

import { DEFAULT_PROPS } from '@utils/constants';
import { formatDate } from '@utils/utils';

import { BrushTypes, type CanvasElement, CanvasElements } from '@mytypes/editorTypes';

import './LeftPanels.css';

const SHAPES_PANEL_ITEMS = [
  {
    type: CanvasElements.Rectangle,
    label: 'Rectangle',
    image: rectangle,
  },
  {
    type: CanvasElements.Ellipse,
    label: 'Ellipse',
    image: ellipse,
  },
  {
    type: CanvasElements.Polygon,
    label: 'Triangle',
    image: triangle,
    sides: 3,
  },
  {
    type: CanvasElements.Polygon,
    label: 'Pentagon',
    image: pentagon,
    sides: 5,
  },
  {
    type: CanvasElements.Polygon,
    label: 'Polygon',
    image: polygon,
    sides: 6,
  },
  {
    type: CanvasElements.Star,
    label: 'Star',
    image: star,
  },
  {
    type: CanvasElements.Line,
    label: 'Line',
    image: line,
  },
  {
    type: CanvasElements.Arrow,
    label: 'Arrow',
    image: arrow,
  },
  // {
  //   type: CanvasElements.Tooltip,
  //   label: 'Tooltip',
  //   image: tooltip,
  // },
];

interface ShapesPanelProps {
  onDragStartFromPanel?: (e: React.DragEvent, blueprintJson: string) => void;
}

export const ShapesPanel = ({ onDragStartFromPanel }: ShapesPanelProps) => {
  const onDragStart = (e: React.DragEvent, el: (typeof SHAPES_PANEL_ITEMS)[number]) => {
    const blueprint = JSON.stringify({
      ...DEFAULT_PROPS[el.type],
      ...('sides' in el ? { sides: el.sides } : {}),
    });

    e.dataTransfer.setData('application/json/canvas-element', blueprint);
    e.dataTransfer.effectAllowed = 'move';

    if (onDragStartFromPanel) onDragStartFromPanel(e, blueprint);
  };

  return (
    <div className="col">
      <p className="t-ital" style={{ fontSize: '0.95rem' }}>
        Drag a shape directly onto the canvas:
      </p>
      <div className="shapes-container">
        {SHAPES_PANEL_ITEMS.map((sh) => (
          <div key={`${sh.label}-${sh.sides}`} className="shape-item">
            <div className="shape-image-container">
              <img
                src={sh.image}
                alt={sh.label}
                className="shape-image"
                draggable
                onDragStart={(e) => onDragStart(e, sh)}
              />
            </div>
            <span className="shape-label">{sh.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ImagesPanel = () => {
  return <div>ImagesPanel</div>;
};

const formatLayerDate = (createdAt?: string) => {
  if (!createdAt) return 'date unknown';
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return 'date unknown';
  return formatDate(date.toString(), true);
};

const getLayerTypeKey = (element: CanvasElement) => {
  if (element.type === CanvasElements.Drawing) return `${element.type}:${element.brushType}`;
  return element.type;
};

const isVisibleLayer = (element: CanvasElement) =>
  element.type !== CanvasElements.Drawing || element.brushType !== BrushTypes.Eraser;

const getLayerTypeTitle = (element: CanvasElement) => {
  switch (element.type) {
    case CanvasElements.Image:
      return 'Image';
    case CanvasElements.Drawing:
      switch (element.brushType) {
        case BrushTypes.Brush:
          return 'Brush drawing';
        case BrushTypes.Marker:
          return 'Marker drawing';
        case BrushTypes.Pencil:
        default:
          return 'Pencil drawing';
      }
    case CanvasElements.Rectangle:
      return 'Rectangle';
    case CanvasElements.Ellipse:
      return 'Ellipse';
    case CanvasElements.Polygon:
      switch (element.sides) {
        case 3:
          return 'Triangle';
        case 5:
          return 'Pentagon';
        default:
          return 'Polygon';
      }
    case CanvasElements.Star:
      return 'Star';
    case CanvasElements.Line:
      return 'Line';
    case CanvasElements.Arrow:
      return 'Arrow';
    // case CanvasElements.Tooltip:
    //   return 'Tooltip';
    case CanvasElements.Arrow:
      return 'Text';
    default:
      return element.type;
  }
};

const getLayerIcon = (element: CanvasElement) => {
  switch (element.type) {
    case CanvasElements.Image:
      return <ImageIcon />;
    case CanvasElements.Drawing:
      switch (element.brushType) {
        case BrushTypes.Brush:
          return <BrushIcon />;
        case BrushTypes.Marker:
          return <MarkerIcon />;
        case BrushTypes.Pencil:
        default:
          return <PencilIcon />;
      }
    case CanvasElements.Rectangle:
      return <RectangleShape />;
    case CanvasElements.Ellipse:
      return <EllipseShape />;
    case CanvasElements.Polygon:
      switch (element.sides) {
        case 3:
          return <TriangleShape />;
        case 5:
          return <PentagonShape />;
        default:
          return <PolygonShape />;
      }
    case CanvasElements.Star:
      return <StarShape />;
    case CanvasElements.Line:
      return <LineShape />;
    case CanvasElements.Arrow:
      return <ArrowShape />;
    // case CanvasElements.Tooltip:
    //   return <TooltipShape />;
    case CanvasElements.Text:
      return <TextIcon />;
    default:
      return <LayerIcon />;
  }
};

export const LayersPanel = () => {
  const dispatch = useAppDispatch();
  const elements = useAppSelector(selectEditor.canvas).elements;
  const visibleElements = elements.filter(isVisibleLayer);
  const selectedIds = useAppSelector(selectEditor.selected);
  const layerNumbersById = new Map<string, number>();
  const typeCounts = new Map<string, number>();

  [...visibleElements]
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : Number.MAX_SAFE_INTEGER;

      if (dateA !== dateB) return dateA - dateB;
      return (a.order ?? 0) - (b.order ?? 0);
    })
    .forEach((element) => {
      const key = getLayerTypeKey(element);
      const count = (typeCounts.get(key) ?? 0) + 1;

      typeCounts.set(key, count);
      layerNumbersById.set(element.id, count);
    });

  if (!visibleElements.length) {
    return <p className="feedback t-ital">No layers yet</p>;
  }

  return (
    <div className="layers-panel">
      {[...visibleElements].reverse().map((element) => {
        const visibleIndex = visibleElements.findIndex((el) => el.id === element.id);
        const isSelected = selectedIds.includes(element.id);
        const title = `${getLayerTypeTitle(element)} #${layerNumbersById.get(element.id) ?? 1}`;

        return (
          <div key={element.id} className={clsx('layer-item', isSelected && 'selected')}>
            <button
              className="layer-select"
              type="button"
              onClick={() => dispatch(setSelectedIds([element.id]))}
            >
              <span className="layer-icon">{getLayerIcon(element)}</span>
              <span className="layer-text">
                <span className="layer-title">{title}</span>
                <span className="layer-subtitle">{formatLayerDate(element.createdAt)}</span>
              </span>
            </button>
            <div className="layer-actions">
              <MainButton
                color="transparent"
                mini
                square
                aria-label="Move layer forward"
                disabled={visibleIndex === visibleElements.length - 1}
                onClick={() =>
                  dispatch(reorderCanvasElements({ ids: [element.id], direction: 'forward' }))
                }
              >
                <ArrowIcon style={{ transform: 'rotate(90deg)' }} />
              </MainButton>
              <MainButton
                color="transparent"
                mini
                square
                aria-label="Move layer backward"
                disabled={visibleIndex === 0}
                onClick={() =>
                  dispatch(reorderCanvasElements({ ids: [element.id], direction: 'backward' }))
                }
              >
                <ArrowIcon style={{ transform: 'rotate(-90deg)' }} />
              </MainButton>
            </div>
          </div>
        );
      })}
    </div>
  );
};
