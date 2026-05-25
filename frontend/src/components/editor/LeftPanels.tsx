import clsx from 'clsx';

import { reorderCanvasElements, selectEditor, setSelectedIds } from '@store/editorSlice';

import { MainButton } from '@components/MainButton';

import { ArrowIcon, ImageIcon, LayerIcon, PencilIcon } from '@assets/index';

import { useAppDispatch, useAppSelector } from '@hooks/utilHooks';

import { BrushTypes, type CanvasElement, CanvasElements } from '@mytypes/editorTypes';

import './LeftPanels.css';

export const ShapesPanel = () => {
  return <div>ShapesPanel</div>;
};

export const ImagesPanel = () => {
  return <div>ImagesPanel</div>;
};

const formatLayerDate = (createdAt?: string) => {
  if (!createdAt) return 'date unknown';

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return 'date unknown';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
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
    default:
      return element.type;
  }
};

const getLayerIcon = (element: CanvasElement) => {
  switch (element.type) {
    case CanvasElements.Image:
      return <ImageIcon />;
    case CanvasElements.Drawing:
      return <PencilIcon />;
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
    return <p className="layers-empty">No layers yet</p>;
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
