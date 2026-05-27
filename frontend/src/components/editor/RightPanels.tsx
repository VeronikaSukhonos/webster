import clsx from 'clsx';

import {
  restoreProjectAt,
  selectEditor,
  setHistoryTarget,
  setRightSheet,
  updateCanvasBackground,
  updateCanvasElements,
} from '@store/editorSlice';

import {
  FieldWrapper,
  NumberField,
  SelectField,
  SelectLabel,
  SizeField,
} from '@components/InputFields';
import { MainButton } from '@components/MainButton';

import {
  BackgroundIcon,
  CropIcon,
  DeleteIcon,
  DetachIcon,
  PlusIcon,
  UploadIcon,
} from '@assets/index';

import { useAppDispatch, useAppSelector } from '@hooks/utilHooks';

import { FONT_FAMILIES } from '@utils/constants';
import { capitalize, formatDate } from '@utils/utils';

import {
  type Action,
  Actions,
  type CanvasElement,
  CanvasElements,
  type Size,
} from '@mytypes/editorTypes';

import './LeftPanels.css';
import './RightPanels.css';

const FONT_FAMILY_OPTIONS = FONT_FAMILIES.map((opt) => ({
  value: opt.value,
  label: <SelectLabel>{opt.label}</SelectLabel>,
}));

export const HistoryPanel = () => {
  const dispatch = useAppDispatch();

  const history = useAppSelector(selectEditor.history);
  const historyTarget = useAppSelector(selectEditor.historyTarget);

  if (!history.length) return <p className="feedback t-ital">No history yet</p>;

  return (
    <div className="layers-panel">
      <div className={clsx('layer-item', historyTarget === -1 && 'selected')}>
        <button
          className="layer-select"
          type="button"
          onClick={() => {
            if (historyTarget === -1) return;
            dispatch(setHistoryTarget(-1));
          }}
        >
          <span className="layer-text">
            <span className="layer-title">Initial State</span>
          </span>
        </button>
        <div>
          <MainButton
            color="transparent"
            mini
            aria-label="Clear all history"
            onClick={() => {
              dispatch(restoreProjectAt(-1));
              dispatch(setRightSheet(null));
            }}
            style={{ fontSize: '0.95rem' }}
          >
            Restore
          </MainButton>
        </div>
      </div>
      <hr />
      {[...history].reverse().map((h, i) => {
        const idx = history.length - 1 - i;
        const selected = historyTarget === idx;
        const title =
          capitalize(h.action) +
          (h.ids.length > 1
            ? ` ${h.ids.length} objects`
            : ` ${capitalize(h.from?.[0].type || h.to?.[0].type || '')}`);

        return (
          <div key={`${i}${h.time}`} className={clsx('layer-item', selected && 'selected')}>
            <button
              className="layer-select"
              type="button"
              onClick={() => {
                if (selected) return;
                dispatch(setHistoryTarget(idx));
              }}
            >
              <span className="layer-text">
                <span className="layer-title">{title}</span>
                <span className="layer-subtitle">{formatDate(h.time, true)}</span>
              </span>
            </button>
            {idx !== history.length - 1 ? (
              <div>
                <MainButton
                  color="transparent"
                  mini
                  aria-label="Restore project at step"
                  onClick={() => {
                    dispatch(restoreProjectAt(idx));
                    dispatch(setRightSheet(null));
                  }}
                  style={{ fontSize: '0.95rem' }}
                >
                  Restore
                </MainButton>
              </div>
            ) : (
              <MainButton
                color="transparent"
                mini
                aria-label="Edit current step"
                onClick={() => {
                  dispatch(restoreProjectAt(idx));
                  dispatch(setRightSheet(null));
                }}
                style={{ fontSize: '0.95rem', color: 'var(--dark-blue)' }}
              >
                Edit
              </MainButton>
            )}
          </div>
        );
      })}
    </div>
  );
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizeRotation = (rotation: number) => {
  const normalized = rotation % 360;

  return normalized < 0 ? normalized + 360 : normalized;
};

const getSignedRotation = (rotation: number) => {
  const normalized = normalizeRotation(rotation);

  return normalized > 180 ? normalized - 360 : normalized;
};

const getColorInputValue = (color: string | undefined, fallback = '#000000') =>
  /^#[0-9a-f]{6}$/i.test(color ?? '') ? (color as string) : fallback;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

const rotatePoint = (point: { x: number; y: number }, rotation: number) => {
  const radians = toRadians(rotation);

  return {
    x: point.x * Math.cos(radians) - point.y * Math.sin(radians),
    y: point.x * Math.sin(radians) + point.y * Math.cos(radians),
  };
};

const getPointsBounds = (points: number[]) => {
  const xs = points.filter((_, index) => index % 2 === 0);
  const ys = points.filter((_, index) => index % 2 === 1);

  if (!xs.length || !ys.length) {
    return {
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
      width: 0,
      height: 0,
    };
  }

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

const getPointsCenter = (points: number[]) => {
  const bounds = getPointsBounds(points);

  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  };
};

const getRotationCenterOffset = (element: CanvasElement) => {
  const scaleX = element.scaleX || 1;
  const scaleY = element.scaleY || 1;

  switch (element.type) {
    case CanvasElements.Rectangle:
    case CanvasElements.Image:
    case CanvasElements.Text:
      return {
        x: (element.width * scaleX) / 2,
        y: (element.height * scaleY) / 2,
      };
    case CanvasElements.Line:
    case CanvasElements.Arrow:
    case CanvasElements.Drawing: {
      const center = getPointsCenter(element.points);

      return {
        x: center.x * scaleX,
        y: center.y * scaleY,
      };
    }
    default:
      return { x: 0, y: 0 };
  }
};

const getCenterRotationChanges = (
  element: CanvasElement,
  rotation: number,
): Partial<CanvasElement> => {
  const centerOffset = getRotationCenterOffset(element);

  if (centerOffset.x === 0 && centerOffset.y === 0) {
    return { rotation } as Partial<CanvasElement>;
  }

  const currentCenterOffset = rotatePoint(centerOffset, element.rotation);
  const nextCenterOffset = rotatePoint(centerOffset, rotation);

  return {
    x: element.x + currentCenterOffset.x - nextCenterOffset.x,
    y: element.y + currentCenterOffset.y - nextCenterOffset.y,
    rotation,
  } as Partial<CanvasElement>;
};

const getElementSize = (element: CanvasElement): Size | null => {
  const scaleX = Math.abs(element.scaleX || 1);
  const scaleY = Math.abs(element.scaleY || 1);

  switch (element.type) {
    case CanvasElements.Rectangle:
    case CanvasElements.Image:
    case CanvasElements.Text:
      return {
        width: Math.round(element.width * scaleX),
        height: Math.round(element.height * scaleY),
      };
    case CanvasElements.Ellipse:
      return {
        width: Math.round(element.radiusX * 2 * scaleX),
        height: Math.round(element.radiusY * 2 * scaleY),
      };
    case CanvasElements.Triangle:
    case CanvasElements.Pentagon:
    case CanvasElements.Polygon:
      return {
        width: Math.round(element.radius * 2 * scaleX),
        height: Math.round(element.radius * 2 * scaleY),
      };
    case CanvasElements.Star:
      return {
        width: Math.round(element.outerRadius * 2 * scaleX),
        height: Math.round(element.outerRadius * 2 * scaleY),
      };
    case CanvasElements.Line:
    case CanvasElements.Arrow:
    case CanvasElements.Drawing: {
      const bounds = getPointsBounds(element.points);

      return {
        width: Math.max(1, Math.round(bounds.width * scaleX)),
        height: Math.max(1, Math.round(bounds.height * scaleY)),
      };
    }
    default:
      return null;
  }
};

const resizePoints = (points: number[], size: Size) => {
  const bounds = getPointsBounds(points);
  const scaleX = bounds.width ? size.width / bounds.width : 1;
  const scaleY = bounds.height ? size.height / bounds.height : 1;

  return points.map((point, index) => {
    if (index % 2 === 0) return bounds.minX + (point - bounds.minX) * scaleX;

    return bounds.minY + (point - bounds.minY) * scaleY;
  });
};

const resizeStraightPoints = (
  points: [startX: number, startY: number, endX: number, endY: number],
  size: Size,
) => {
  const [startX, startY, endX, endY] = points;
  const widthDirection = endX < startX ? -1 : 1;
  const heightDirection = endY < startY ? -1 : 1;

  return [
    startX,
    startY,
    startX + (size.width <= 1 ? 0 : size.width * widthDirection),
    startY + (size.height <= 1 ? 0 : size.height * heightDirection),
  ] as [startX: number, startY: number, endX: number, endY: number];
};

const getSizeChanges = (element: CanvasElement, size: Size): Partial<CanvasElement> | null => {
  const scaleX = Math.abs(element.scaleX || 1);
  const scaleY = Math.abs(element.scaleY || 1);
  const width = Math.max(1, size.width);
  const height = Math.max(1, size.height);

  switch (element.type) {
    case CanvasElements.Rectangle:
    case CanvasElements.Image:
    case CanvasElements.Text:
      return {
        width: width / scaleX,
        height: height / scaleY,
      } as Partial<CanvasElement>;
    case CanvasElements.Ellipse:
      return {
        radiusX: width / scaleX / 2,
        radiusY: height / scaleY / 2,
      } as Partial<CanvasElement>;
    case CanvasElements.Triangle:
    case CanvasElements.Pentagon:
    case CanvasElements.Polygon:
      return { radius: Math.min(width / scaleX, height / scaleY) / 2 } as Partial<CanvasElement>;
    case CanvasElements.Star:
      return {
        outerRadius: Math.min(width / scaleX, height / scaleY) / 2,
        innerRadius: Math.min(width / scaleX, height / scaleY) / 4,
      } as Partial<CanvasElement>;
    case CanvasElements.Line:
    case CanvasElements.Arrow:
      return {
        points: resizeStraightPoints(element.points, {
          width: width / scaleX,
          height: height / scaleY,
        }),
      } as Partial<CanvasElement>;
    case CanvasElements.Drawing:
      return {
        points: resizePoints(element.points, {
          width: width / scaleX,
          height: height / scaleY,
        }),
      } as Partial<CanvasElement>;
    default:
      return null;
  }
};

const canUseFill = (element: CanvasElement) =>
  ![CanvasElements.Line, CanvasElements.Arrow, CanvasElements.Drawing, CanvasElements.Image].some(
    (type) => type === element.type,
  );

const canUseBorderRadius = (element: CanvasElement) =>
  element.type === CanvasElements.Rectangle || element.type === CanvasElements.Image;

const getBorderRadius = (element: CanvasElement) => {
  if (!canUseBorderRadius(element) || !('cornerRadius' in element)) return 0;

  return element.cornerRadius[0] ?? 0;
};

const getShadowOffset = (element: CanvasElement, axis: 'x' | 'y') =>
  element.shadowOffset?.[axis] ?? 0;

const getCornerRadiusChanges = (radius: number): Partial<CanvasElement> => {
  return {
    cornerRadius: [radius, radius, radius, radius],
  } as Partial<CanvasElement>;
};

interface ElementPanelProps {
  onUploadBackgroundImage?: () => void;
  onBackgroundImageToObject?: () => void;
  onImageToBackground?: (element: CanvasElement) => void;
  onClearBackgroundImage?: () => void;
  activeImageCropId?: string;
  onStartImageCrop?: (element: CanvasElement) => void;
  onApplyImageCrop?: () => void;
  onCancelImageCrop?: () => void;
}

export const ElementPanel = ({
  onUploadBackgroundImage,
  onBackgroundImageToObject,
  onImageToBackground,
  onClearBackgroundImage,
  activeImageCropId,
  onStartImageCrop,
  onApplyImageCrop,
  onCancelImageCrop,
}: ElementPanelProps) => {
  const dispatch = useAppDispatch();
  const canvas = useAppSelector(selectEditor.canvas);
  const elements = canvas.elements;
  const selectedIds = useAppSelector(selectEditor.selected);
  const selectedElements = elements.filter((element) => selectedIds.includes(element.id));

  const buttonProps = {
    color: 'blue' as const,
    mini: true,
    wide: true,
    style: { fontSize: '1rem', gap: 4 },
  };

  const inputProps = {
    color: 'gray' as const,
    mini: true,
  };

  if (!selectedElements.length || selectedIds.includes(CanvasElements.Background)) {
    return (
      <div className="element-panel">
        <h4 className="element-panel-title">Color</h4>
        <FieldWrapper {...inputProps}>
          <input
            className="color-input"
            type="color"
            value={canvas.background.fill === 'transparent' ? '#ffffff' : canvas.background.fill}
            onChange={(e) =>
              dispatch(
                updateCanvasBackground({
                  changes: { fill: e.target.value },
                  action: Actions.Fill,
                }),
              )
            }
          />
        </FieldWrapper>
        <h4 className="element-panel-title">Image</h4>
        <div className="element-panel-actions">
          <MainButton onClick={() => onUploadBackgroundImage?.()} {...buttonProps}>
            Upload New <UploadIcon />
          </MainButton>
          {canvas.background.image && (
            <>
              <MainButton onClick={() => onBackgroundImageToObject?.()} {...buttonProps}>
                Detach from Background <DetachIcon />
              </MainButton>
              <MainButton onClick={() => onClearBackgroundImage?.()} {...buttonProps}>
                Delete Current <DeleteIcon />
              </MainButton>
            </>
          )}
        </div>
      </div>
    );
  }

  if (selectedElements.length > 1) {
    return (
      <div className="element-panel">
        <h3 className="content-title mini">{selectedElements.length} elements selected</h3>
        <p className="feedback t-ital">
          Group transformations are available on the canvas. Detailed editing is available for one
          object.
        </p>
      </div>
    );
  }

  const element = selectedElements[0];
  const isCroppingImage = element.type === CanvasElements.Image && activeImageCropId === element.id;

  const updateElement = (changes: Partial<CanvasElement>, action: Action = Actions.Resize) => {
    dispatch(updateCanvasElements({ updates: [{ id: element.id, changes }], action }));
  };

  const size = getElementSize(element);

  return (
    <div className="element-panel">
      <h4 className="element-panel-title">Placement</h4>
      <div className="element-panel-section">
        <NumberField
          name="x"
          label="X"
          value={Math.round(element.x)}
          onChange={(e) => updateElement({ x: e.target.value ?? element.x })}
          step={1}
          {...inputProps}
        />
        <NumberField
          name="y"
          label="Y"
          value={Math.round(element.y)}
          onChange={(e) => updateElement({ y: e.target.value ?? element.y })}
          step={1}
          {...inputProps}
        />
      </div>

      <div className="element-panel-section">
        <NumberField
          name="rotation"
          label="Rotation"
          value={Math.round(getSignedRotation(element.rotation))}
          onChange={(e) =>
            updateElement(
              getCenterRotationChanges(
                element,
                normalizeRotation(e.target.value ?? getSignedRotation(element.rotation)),
              ),
              Actions.Rotate,
            )
          }
          step={1}
          format="degree"
          {...inputProps}
        />
        <NumberField
          name="opacity"
          label="Opacity"
          value={element.opacity}
          onChange={(e) =>
            updateElement({ opacity: clamp(e.target.value ?? element.opacity, 0, 1) })
          }
          min={0}
          max={1}
          step={0.01}
          format="percent"
          {...inputProps}
        />
      </div>

      {size && (
        <>
          <h4 className="element-panel-title">Size</h4>
          <SizeField
            name="element-size"
            value={size}
            onChange={(e) => {
              const changes = getSizeChanges(element, e.target.value);
              if (changes) updateElement(changes);
            }}
            min={1}
            step={1}
            innerLabels
            {...inputProps}
          />
        </>
      )}

      {element.type === CanvasElements.Image && (
        <>
          <h4 className="element-panel-title">Image</h4>
          <div className="element-panel-actions">
            {isCroppingImage ? (
              <div className="element-panel-section">
                <MainButton onClick={() => onApplyImageCrop?.()} {...buttonProps}>
                  Apply crop <CropIcon />
                </MainButton>
                <MainButton onClick={() => onCancelImageCrop?.()} {...buttonProps}>
                  Cancel crop <PlusIcon style={{ transform: 'rotate(45deg)' }} />
                </MainButton>
              </div>
            ) : (
              <>
                <MainButton onClick={() => onStartImageCrop?.(element)} {...buttonProps}>
                  Crop image <CropIcon />
                </MainButton>
                <MainButton onClick={() => onImageToBackground?.(element)} {...buttonProps}>
                  Attach to Background <BackgroundIcon />
                </MainButton>
              </>
            )}
          </div>
        </>
      )}

      {element.type === CanvasElements.Text && (
        <>
          <h4 className="element-panel-title">Fonts</h4>
          <SelectField
            name="fontFamily"
            label="Font family"
            value={element.fontFamily}
            onChange={(e) => updateElement({ fontFamily: e.target.value }, Actions.TextFont)}
            options={FONT_FAMILY_OPTIONS}
            mini
          />
          <div className="element-panel-section">
            <NumberField
              name="fontSize"
              label="Font size"
              value={Math.round(element.fontSize)}
              onChange={(e) =>
                updateElement({ fontSize: e.target.value ?? element.fontSize }, Actions.TextFont)
              }
              min={1}
              max={300}
              step={1}
              mini
            />
            <NumberField
              name="padding"
              label="Padding"
              value={Math.round(element.padding)}
              onChange={(e) =>
                updateElement({ padding: e.target.value ?? element.padding }, Actions.TextFont)
              }
              min={0}
              max={300}
              step={1}
              mini
            />
          </div>
        </>
      )}

      {canUseFill(element) && (
        <>
          <h4 className="element-panel-title">Color</h4>
          <FieldWrapper {...inputProps}>
            <input
              className="color-input"
              type="color"
              value={getColorInputValue(element.fill, '#ffffff')}
              onChange={(e) => updateElement({ fill: e.target.value }, Actions.Fill)}
            />
          </FieldWrapper>
        </>
      )}

      <h4 className="element-panel-title">Border</h4>
      <div className="element-panel-section">
        <FieldWrapper label="Color" {...inputProps}>
          <input
            className="color-input"
            type="color"
            value={getColorInputValue(element.stroke)}
            onChange={(e) => updateElement({ stroke: e.target.value }, Actions.Stroke)}
          />
        </FieldWrapper>
        <NumberField
          name="strokeWidth"
          label="Width"
          value={Math.round(element.strokeWidth)}
          onChange={(e) =>
            updateElement({ strokeWidth: e.target.value ?? element.strokeWidth }, Actions.Stroke)
          }
          min={0}
          max={120}
          step={1}
          {...inputProps}
        />
      </div>

      {canUseBorderRadius(element) && (
        <NumberField
          name="cornerRadius"
          label="Corner Radius"
          value={getBorderRadius(element)}
          onChange={(e) =>
            updateElement(
              getCornerRadiusChanges(e.target.value ?? getBorderRadius(element)),
              Actions.Stroke,
            )
          }
          min={0}
          max={500}
          step={1}
          {...inputProps}
        />
      )}

      <h4 className="element-panel-title">Shadow</h4>
      <FieldWrapper label="Color" {...inputProps}>
        <input
          className="color-input"
          type="color"
          value={getColorInputValue(element.shadowColor)}
          onChange={(e) => updateElement({ shadowColor: e.target.value }, Actions.Shadow)}
        />
      </FieldWrapper>
      <div className="element-panel-section">
        <NumberField
          name="shadowBlur"
          label="Blur"
          value={Math.round(element.shadowBlur ?? 0)}
          onChange={(e) => updateElement({ shadowBlur: e.target.value ?? 0 }, Actions.Shadow)}
          min={0}
          max={200}
          step={1}
          {...inputProps}
        />
        <NumberField
          name="shadowOpacity"
          label="Opacity"
          value={element.shadowOpacity ?? 0}
          onChange={(e) =>
            updateElement({ shadowOpacity: clamp(e.target.value ?? 0, 0, 1) }, Actions.Shadow)
          }
          min={0}
          max={1}
          step={0.01}
          format="percent"
          {...inputProps}
        />
      </div>
      <div className="element-panel-section">
        <NumberField
          name="shadowOffsetX"
          label="Offset X"
          value={Math.round(getShadowOffset(element, 'x'))}
          onChange={(e) =>
            updateElement(
              {
                shadowOffset: {
                  x: e.target.value ?? 0,
                  y: getShadowOffset(element, 'y'),
                },
              },
              Actions.Shadow,
            )
          }
          step={1}
          {...inputProps}
        />
        <NumberField
          name="shadowOffsetY"
          label="Offset Y"
          value={Math.round(getShadowOffset(element, 'y'))}
          onChange={(e) =>
            updateElement(
              {
                shadowOffset: {
                  x: getShadowOffset(element, 'x'),
                  y: e.target.value ?? 0,
                },
              },
              Actions.Shadow,
            )
          }
          step={1}
          {...inputProps}
        />
      </div>
    </div>
  );
};
