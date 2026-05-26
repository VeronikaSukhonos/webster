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
import { capitalize, formatDate } from '@utils/utils';

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
    type: CanvasElements.Triangle,
    label: 'Triangle',
    image: triangle,
    sides: 3,
  },
  {
    type: CanvasElements.Pentagon,
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

export const ShapesPanel = () => {
  const lastUsedStyle = useAppSelector(selectEditor.lastUsedStyle);

  const onDragStart = (e: React.DragEvent, el: (typeof SHAPES_PANEL_ITEMS)[number]) => {
    e.dataTransfer.setData(
      'application/json/canvas-element',
      JSON.stringify({
        ...DEFAULT_PROPS[el.type],
        fill: lastUsedStyle.fill,
        stroke: lastUsedStyle.stroke,
        strokeWidth:
          el.type === CanvasElements.Arrow || el.type === CanvasElements.Line
            ? lastUsedStyle.strokeWidth
            : lastUsedStyle.shapeStrokeWidth,
      }),
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="col">
      <p className="t-ital" style={{ fontSize: '0.95rem' }}>
        Drag a shape directly onto the canvas:
      </p>
      <div className="shapes-container">
        {SHAPES_PANEL_ITEMS.map((sh) => (
          <div key={sh.label} className="shape-item">
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
    default:
      return capitalize(element.type);
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
    case CanvasElements.Triangle:
      return <TriangleShape />;
    case CanvasElements.Pentagon:
      return <PentagonShape />;
    case CanvasElements.Polygon:
      return <PolygonShape />;
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

const getLayerSizeInfo = (element: CanvasElement) => {
  const scaleX = Math.abs(element.scaleX || 1);
  const scaleY = Math.abs(element.scaleY || 1);

  switch (element.type) {
    case CanvasElements.Rectangle:
    case CanvasElements.Image:
    case CanvasElements.Text:
      return `${Math.round(element.width * scaleX)} x ${Math.round(element.height * scaleY)}`;
    case CanvasElements.Ellipse:
      return `${Math.round(element.radiusX * 2 * scaleX)} x ${Math.round(element.radiusY * 2 * scaleY)}`;
    case CanvasElements.Triangle:
    case CanvasElements.Pentagon:
    case CanvasElements.Polygon:
      return `${Math.round(element.radius * 2 * scaleX)} x ${Math.round(element.radius * 2 * scaleY)}`;
    case CanvasElements.Star:
      return `${Math.round(element.outerRadius * 2 * scaleX)} x ${Math.round(element.outerRadius * 2 * scaleY)}`;
    case CanvasElements.Line:
    case CanvasElements.Arrow:
      return `${Math.round(element.strokeWidth)}px stroke`;
    case CanvasElements.Drawing:
      return `${element.points.length / 2} points`;
    default:
      return 'size unknown';
  }
};

const getLayerDetails = (element: CanvasElement) => {
  return [
    getLayerSizeInfo(element),
    `${Math.round(element.rotation)}°`,
    `${Math.round(element.opacity * 100)}%`,
  ].join(' · ');
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
        const title = `${getLayerTypeTitle(element)} #${
          element.layerNumber ?? layerNumbersById.get(element.id) ?? 1
        }`;

        return (
          <div key={element.id} className={clsx('layer-item', isSelected && 'selected')}>
            <button
              className="layer-select"
              type="button"
              aria-pressed={isSelected}
              onClick={(e) => {
                if (e.ctrlKey || e.metaKey) {
                  dispatch(
                    setSelectedIds(
                      isSelected
                        ? selectedIds.filter((id) => id !== element.id)
                        : [...selectedIds, element.id],
                    ),
                  );
                  return;
                }

                dispatch(setSelectedIds([element.id]));
              }}
            >
              <span className="layer-icon">{getLayerIcon(element)}</span>
              <span className="layer-text">
                <span className="layer-title">{title}</span>
                <span className="layer-subtitle">{formatLayerDate(element.createdAt)}</span>
                <span className="layer-details">{getLayerDetails(element)}</span>
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
