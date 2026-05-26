import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Group, Layer, Line, Rect, Stage, Transformer } from 'react-konva';
import { Portal } from 'react-konva-utils';
import { toast } from 'react-toastify';

import clsx from 'clsx';
import type { KonvaEventObject } from 'konva/lib/Node';

import {
  addCanvasElements,
  commitCanvasElementsMove,
  deleteCanvasElements,
  moveCanvasElements,
  reorderCanvasElements,
  selectEditor,
  setCanvasSize,
  setLeftSheet,
  setRightSheet,
  setSelectedIds,
  setTool,
  translateCanvasElements,
  updateCanvasElements,
} from '@store/editorSlice';

import { NumberField, SizeField } from '@components/InputFields';
import { MainButton } from '@components/MainButton';
import { Popover } from '@components/Menu';
import { CanvasElementShape, CanvasImage } from '@components/editor/CanvasElementShape';
import { LayersPanel } from '@components/editor/LeftPanels';
import { ElementPanel } from '@components/editor/RightPanels';
import { Sheet } from '@components/editor/Sheet';
import { Toolbar } from '@components/editor/Toolbar';

import grabCursor from '@assets/grab.png';
import grabbingCursor from '@assets/grabbing.png';
import { LayerIcon, QuestionIcon, SettingsIcon } from '@assets/index';
import selectCursor from '@assets/select.png';

import { useStageSize } from '@hooks/editor/useStageSize';
import { useToolbar } from '@hooks/editor/useToolbar';
import { useDebounce } from '@hooks/useDebounce';
import { useImages } from '@hooks/useImages';
import { useAppDispatch, useAppSelector } from '@hooks/utilHooks';

import {
  DEFAULT_BORDER_COLOR,
  DEFAULT_PROPS,
  ERROR_TYPES,
  MAX_CANVAS_SIZE,
  MAX_FILE_SIZE,
  MAX_SCALE,
  MIN_CANVAS_SIZE,
  MIN_SCALE,
  SCALE_FACTOR,
  SUPPORTED_UPLOADS,
} from '@utils/constants';
import { createLocalImageItem } from '@utils/editorUtils';
import { shortcuts } from '@utils/shortcuts';

import {
  Actions,
  BrushTypes,
  type CanvasElement,
  CanvasElements,
  type CanvasProps,
  LeftSheets,
  Modes,
  RightSheets,
  Tools,
} from '@mytypes/editorTypes';

import './Editor.css';

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;

  return !!target.closest('input, textarea, select, [contenteditable="true"]');
};

const cloneCanvasElement = (element: CanvasElement, offset = 0): CanvasElement => {
  const clone = structuredClone(element);

  return {
    ...clone,
    id: crypto.randomUUID(),
    layerNumber: undefined,
    x: clone.x + offset,
    y: clone.y + offset,
    createdAt: new Date().toISOString(),
  };
};

const areStringArraysEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const isEraserElement = (element: CanvasElement) =>
  element.type === CanvasElements.Drawing && element.brushType === BrushTypes.Eraser;

const getElementCreatedTime = (element: CanvasElement) => {
  const createdTime = element.createdAt ? new Date(element.createdAt).getTime() : NaN;

  return Number.isNaN(createdTime) ? 0 : createdTime;
};

const getCanvasPaintOrder = (elements: CanvasElement[]) => {
  const orderedElements: CanvasElement[] = [];

  elements.forEach((element) => {
    if (!isEraserElement(element)) {
      orderedElements.push(element);
      return;
    }

    const eraserCreatedTime = getElementCreatedTime(element);
    const firstNewerElementIndex = orderedElements.findIndex(
      (el) => !isEraserElement(el) && getElementCreatedTime(el) > eraserCreatedTime,
    );

    if (firstNewerElementIndex === -1) orderedElements.push(element);
    else orderedElements.splice(firstNewerElementIndex, 0, element);
  });

  return orderedElements;
};

const normalizeRotation = (rotation: number) => {
  const normalized = rotation % 360;

  return normalized < 0 ? normalized + 360 : normalized;
};

export interface EditorProps extends CanvasProps {
  onSave?: () => void | Promise<unknown>;
}

export const Editor = ({ stageRef, backgroundRef, onSave }: EditorProps) => {
  const dispatch = useAppDispatch();
  const imagesCtx = useImages();
  const clipboardRef = useRef<CanvasElement[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasElementsRef = useRef<CanvasElement[]>([]);
  const keyboardMoveRef = useRef<{ ids: string[]; from: CanvasElement[] } | null>(null);
  const [keyboardMoveTick, setKeyboardMoveTick] = useState(0);
  const debouncedKeyboardMoveTick = useDebounce(keyboardMoveTick, 500);

  const canvas = useAppSelector(selectEditor.canvas);
  const selectedIds = useAppSelector(selectEditor.selected);
  const tool = useAppSelector(selectEditor.tool);
  const mode = useAppSelector(selectEditor.mode);
  const leftSheet = useAppSelector(selectEditor.leftSheet);
  const rightSheet = useAppSelector(selectEditor.rightSheet);
  const project = useAppSelector(selectEditor.project);
  const canvasPaintElements = useMemo(
    () => getCanvasPaintOrder(canvas.elements),
    [canvas.elements],
  );
  const selectedCanvasElements = canvas.elements.filter((el) => selectedIds.includes(el.id));
  const selectedElementIdsForRender = new Set(selectedCanvasElements.map((el) => el.id));
  const selectedGroupRenderIndex = canvasPaintElements.reduce(
    (lastIndex, el, index) => (selectedElementIdsForRender.has(el.id) ? index : lastIndex),
    -1,
  );

  const [isTransforming, setisTransforming] = useState(false);

  const { stageSize } = useStageSize();
  const {
    stageZoom,
    setStageZoom,
    selectRectProps,
    transformerRef,
    backdropRef,
    selectGroupRef,
    selectGroupPos,
    setSelectGroupPos,
    eraserCursorRef,
    drawingLineRef,
    // onTransformEnd,
    ...toolbarHandlers
  } = useToolbar(stageRef);

  const flushKeyboardMove = useCallback(() => {
    const pendingMove = keyboardMoveRef.current;

    if (!pendingMove) return;

    const to = structuredClone(
      canvasElementsRef.current.filter((el) => pendingMove.ids.includes(el.id)),
    );

    dispatch(
      commitCanvasElementsMove({
        ids: pendingMove.ids,
        from: pendingMove.from,
        to,
      }),
    );
    keyboardMoveRef.current = null;
  }, [dispatch]);

  const handleImageUpload = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []).filter(
        (file) => SUPPORTED_UPLOADS.includes(file.type) && file.size <= MAX_FILE_SIZE,
      );

      if (!files.length) {
        e.target.value = '';
        return;
      }

      const imageItems = files.map((file) => createLocalImageItem(file, true));
      const baseX = (stageSize.width - canvas.background.width) / 2 + 20;
      const baseY = (stageSize.height - canvas.background.height) / 2 + 20;

      imagesCtx?.addLocalImageItems(imageItems);
      dispatch(setTool(Tools.Select));
      dispatch(
        addCanvasElements(
          imageItems.map(
            (image, index) =>
              ({
                ...DEFAULT_PROPS[CanvasElements.Image],
                id: crypto.randomUUID(),
                x: baseX + index * 20,
                y: baseY + index * 20,
                image: image.id,
              }) as CanvasElement,
          ),
        ),
      );
      e.target.value = '';
    },
    [canvas.background.height, canvas.background.width, dispatch, imagesCtx, stageSize],
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    stage.setPointersPositions(e);
    const p = stage.getRelativePointerPosition();
    if (!p) return;

    try {
      const data = e.dataTransfer.getData('application/json/canvas-element');
      if (!data) return;

      const el: CanvasElement = {
        id: crypto.randomUUID(),
        ...JSON.parse(data),
        x: p.x,
        y: p.y,
      };
      dispatch(setTool(Tools.Select));
      dispatch(addCanvasElements([el]));
    } catch (err) {
      toast(ERROR_TYPES.SWW);
    }
  };

  const resetSelectGroupTransform = useCallback(() => {
    const group = selectGroupRef.current;
    if (!group) return;

    group.position({ x: 0, y: 0 });
    group.scale({ x: 1, y: 1 });
    group.rotation(0);
    setSelectGroupPos({ x: 0, y: 0 });
  }, [selectGroupRef, setSelectGroupPos]);

  const handleTransformEnd = useCallback(() => {
    const stage = stageRef.current;
    const group = selectGroupRef.current;
    if (!stage || !group) return;

    const updates = group
      .find('.element')
      .map((node) => {
        const id = node.id();
        if (!selectedIds.includes(id)) return null;

        const transform = node.getAbsoluteTransform(stage).decompose();

        return {
          id,
          changes: {
            x: transform.x,
            y: transform.y,
            rotation: normalizeRotation(transform.rotation),
            scaleX: transform.scaleX,
            scaleY: transform.scaleY,
          },
        };
      })
      .filter((update): update is NonNullable<typeof update> => !!update);

    setisTransforming(false);
    resetSelectGroupTransform();

    if (updates.length) {
      dispatch(updateCanvasElements({ updates, action: Actions.Resize }));
    }
  }, [dispatch, resetSelectGroupTransform, selectedIds, stageRef, selectGroupRef]);

  useEffect(() => {
    canvasElementsRef.current = canvas.elements;

    transformerRef.current?.forceUpdate();
    transformerRef.current?.getLayer()?.batchDraw();
  }, [canvas.elements, selectedIds, transformerRef]);

  useEffect(() => {
    flushKeyboardMove();
  }, [debouncedKeyboardMoveTick, flushKeyboardMove]);

  useEffect(() => () => flushKeyboardMove(), [flushKeyboardMove]);

  useEffect(() => {
    if (!backdropRef.current || !stageRef.current) return;
    if (!selectGroupRef.current || selectedIds.length === 0) {
      backdropRef.current.setAttrs({ x: 0, y: 0, width: 0, height: 0 });
      return;
    }
    const { x, y, width, height } = selectGroupRef.current.getClientRect({
      relativeTo: selectGroupRef.current,
    });
    backdropRef.current.setAttrs({ x, y, width, height });
    selectGroupRef.current.position(selectGroupPos);
  }, [selectedIds, canvas.elements, stageRef.current]);

  useEffect(() => {
    if (mode !== Modes.Edit) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;

      const selectedElementIds = selectedIds.filter((id) => id !== 'background');
      const selectedElements = canvas.elements.filter((el) => selectedElementIds.includes(el.id));
      const isCommand = e.ctrlKey || e.metaKey;

      if (isCommand && e.key.toLowerCase() === 's') {
        e.preventDefault();
        flushKeyboardMove();
        void onSave?.();
        return;
      }

      if (isCommand && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        flushKeyboardMove();
        setStageZoom({ newScale: Math.min(MAX_SCALE, stageZoom * SCALE_FACTOR) });
        return;
      }

      if (isCommand && e.key === '-') {
        e.preventDefault();
        flushKeyboardMove();
        setStageZoom({ newScale: Math.max(MIN_SCALE, stageZoom / SCALE_FACTOR) });
        return;
      }

      if (isCommand && e.key === '0') {
        e.preventDefault();
        flushKeyboardMove();
        setStageZoom({ newScale: 1 });
        return;
      }

      if (isCommand && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        flushKeyboardMove();
        fileInputRef.current?.click();
        return;
      }

      if (isCommand && e.key === '[' && selectedElementIds.length) {
        e.preventDefault();
        flushKeyboardMove();
        dispatch(reorderCanvasElements({ direction: 'backward' }));
        return;
      }

      if (isCommand && e.key === ']' && selectedElementIds.length) {
        e.preventDefault();
        flushKeyboardMove();
        dispatch(reorderCanvasElements({ direction: 'forward' }));
        return;
      }

      if (isCommand && e.key.toLowerCase() === 'c' && selectedElements.length) {
        e.preventDefault();
        flushKeyboardMove();
        clipboardRef.current = structuredClone(selectedElements);
        return;
      }

      if (isCommand && e.key.toLowerCase() === 'x' && selectedElements.length) {
        e.preventDefault();
        flushKeyboardMove();
        clipboardRef.current = structuredClone(selectedElements);
        dispatch(deleteCanvasElements());
        return;
      }

      if (isCommand && e.key.toLowerCase() === 'v' && clipboardRef.current.length) {
        e.preventDefault();
        flushKeyboardMove();
        const pastedElements = clipboardRef.current.map((el) => cloneCanvasElement(el, 10));

        clipboardRef.current = structuredClone(pastedElements);
        dispatch(addCanvasElements(pastedElements));
        return;
      }

      if (isCommand && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        flushKeyboardMove();
        dispatch(setSelectedIds(canvas.elements.map((el) => el.id)));
        return;
      }

      if (e.key === 'Escape' && selectedIds.length) {
        e.preventDefault();
        flushKeyboardMove();
        dispatch(setSelectedIds([]));
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementIds.length) {
        e.preventDefault();
        flushKeyboardMove();
        dispatch(deleteCanvasElements());
        return;
      }

      const moveByKey: Record<string, { moveX: number; moveY: number }> = {
        ArrowUp: { moveX: 0, moveY: -1 },
        ArrowDown: { moveX: 0, moveY: 1 },
        ArrowLeft: { moveX: -1, moveY: 0 },
        ArrowRight: { moveX: 1, moveY: 0 },
      };
      const move = moveByKey[e.key];

      if (move && selectedElementIds.length) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;

        if (
          !keyboardMoveRef.current ||
          !areStringArraysEqual(keyboardMoveRef.current.ids, selectedElementIds)
        ) {
          flushKeyboardMove();
          keyboardMoveRef.current = {
            ids: selectedElementIds,
            from: structuredClone(selectedElements),
          };
        }

        dispatch(
          translateCanvasElements({
            ids: selectedElementIds,
            moveX: move.moveX * step,
            moveY: move.moveY * step,
          }),
        );
        setKeyboardMoveTick((tick) => tick + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    canvas.elements,
    dispatch,
    flushKeyboardMove,
    mode,
    onSave,
    selectedIds,
    setStageZoom,
    stageZoom,
  ]);

  return (
    <div className="work-area" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
      <input
        ref={fileInputRef}
        type="file"
        accept={SUPPORTED_UPLOADS.join(',')}
        multiple
        hidden
        onChange={handleImageUpload}
      />
      <Toolbar onUploadImage={() => fileInputRef.current?.click()} />
      <Stage
        {...stageSize}
        {...toolbarHandlers}
        style={{ background: 'var(--dark-gray)' }}
        draggable={tool === Tools.Grab}
        ref={stageRef}
      >
        <Layer id="background-layer" listening={mode !== Modes.View}>
          <Group
            x={useMemo(() => (stageSize.width - canvas.background.width) / 2, [])}
            y={useMemo(() => (stageSize.height - canvas.background.height) / 2, [])}
          >
            <Rect
              name="excluded"
              width={canvas.background.width}
              height={canvas.background.height}
              fill="white"
              stroke="white"
              shadowOffsetY={4}
              shadowBlur={30}
              shadowOpacity={0.15}
              shadowColor="#341734"
            />
            <Rect {...canvas.background} ref={backgroundRef} />
            {canvas.background.image && <CanvasImage el={canvas.background} />}
            {selectedIds.includes('background') && (
              <Rect
                x={-3}
                y={-3}
                width={canvas.background.width + 6}
                height={canvas.background.height + 6}
                stroke={DEFAULT_BORDER_COLOR}
                strokeWidth={1}
                listening={false}
              />
            )}
          </Group>
        </Layer>
        <Layer id="elements-layer" listening={mode !== Modes.View}>
          {canvasPaintElements.map((el, index) => {
            if (!selectedElementIdsForRender.has(el.id))
              return <CanvasElementShape key={el.id} element={el} />;

            if (index !== selectedGroupRenderIndex) return null;
            return (
              <Portal selector="#act-layer" enabled={isTransforming}>
                <Rect
                  ref={backdropRef}
                  fill="red"
                  listening={selectedIds.length > 0}
                  draggable
                  onDragStart={(e: KonvaEventObject<DragEvent>) => {
                    e.target.stopDrag();
                    if (selectGroupRef.current) selectGroupRef.current.startDrag();
                  }}
                  onMouseOver={() => {
                    if (stageRef.current && tool === Tools.Select)
                      stageRef.current.container().style.cursor = `url(${grabCursor}), grab`;
                  }}
                  onMouseLeave={() => {
                    if (stageRef.current && tool === Tools.Select)
                      stageRef.current.container().style.cursor = `url(${selectCursor}), default`;
                  }}
                />
                <Group
                  key="selected-elements"
                  id="select-group"
                  ref={selectGroupRef}
                  draggable={tool === Tools.Select}
                  onDragStart={(e: KonvaEventObject<DragEvent>) => {
                    setSelectGroupPos({ x: e.target.x(), y: e.target.y() });
                    setisTransforming(true);
                  }}
                  onDragMove={() => {
                    if (!selectGroupRef.current || !backdropRef.current) return;
                    const { x, y } = selectGroupRef.current.getClientRect({
                      relativeTo: selectGroupRef.current,
                    });
                    backdropRef.current.setAttrs({ x, y });
                    if (stageRef.current)
                      stageRef.current.container().style.cursor = `url(${grabbingCursor}), grabbing`;
                  }}
                  onDragEnd={(e: KonvaEventObject<DragEvent>) => {
                    if (!stageRef.current) return;
                    flushKeyboardMove();
                    const moveX = e.target.x() - selectGroupPos.x;
                    const moveY = e.target.y() - selectGroupPos.y;

                    if (moveX === 0 && moveY === 0) return;
                    dispatch(moveCanvasElements({ moveX, moveY }));
                    setisTransforming(false);
                    if (stageRef.current)
                      stageRef.current.container().style.cursor = `url(${grabCursor}), grab`;
                  }}
                  onMouseOver={() => {
                    if (stageRef.current && tool === Tools.Select)
                      stageRef.current.container().style.cursor = `url(${grabCursor}), grab`;
                  }}
                >
                  {selectedCanvasElements.map((el) => (
                    <CanvasElementShape key={el.id} element={el} />
                  ))}
                </Group>
              </Portal>
            );
          })}
          <Line ref={drawingLineRef} listening={false} />
        </Layer>
        <Layer id="act-layer" listening={mode !== Modes.View}>
          <Transformer
            name="excluded"
            ref={transformerRef}
            boundBoxFunc={(o, n) => (n.width < 1 || n.height < 1 ? o : n)}
            borderStroke={DEFAULT_BORDER_COLOR}
            borderStrokeWidth={1}
            anchorFill="white"
            anchorStroke={DEFAULT_BORDER_COLOR}
            anchorStrokeWidth={2}
            anchorSize={10}
            anchorCornerRadius={20}
            onTransformStart={() => setisTransforming(true)}
            onTransformEnd={handleTransformEnd}
          />
          <Rect {...selectRectProps} />
        </Layer>
      </Stage>
      <div className="eraser-cursor-overlay" ref={eraserCursorRef} />

      <div className="bottom-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sheet
            title={LeftSheets.Layers}
            isOpen={leftSheet?.type === LeftSheets.Layers}
            setIsOpen={() => dispatch(setLeftSheet(LeftSheets.Layers))}
            buttonProps={{
              noStyle: true,
              className: 'tool-container mini square',
              tooltipId: LeftSheets.Layers,
              children: (
                <LayerIcon
                  className={clsx('own-color', leftSheet?.type === LeftSheets.Layers && 'active')}
                />
              ),
            }}
          >
            <LayersPanel />
          </Sheet>
          <div className="tool-container mini" style={{ maxWidth: '125px' }}>
            <NumberField
              name="stage-scale"
              value={stageZoom}
              onChange={(e) => setStageZoom({ newScale: e.target.value as number })}
              min={MIN_SCALE}
              max={MAX_SCALE}
              step={0.1}
              align="center"
              buttons
              format="percent"
              noStyle
              mini
            />
          </div>
        </div>
        {mode !== Modes.View && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="tool-container mini canvas-size-toolbar">
              <SizeField
                name="canvas-size"
                value={{ width: canvas.background.width, height: canvas.background.height }}
                onChange={(e) => dispatch(setCanvasSize(e.target.value))}
                disabled={!!(project && project.template)}
                min={MIN_CANVAS_SIZE}
                max={MAX_CANVAS_SIZE}
                align="center"
                noStyle
                mini
              />
            </div>
            <Sheet
              title={RightSheets.Element}
              isOpen={rightSheet?.type === RightSheets.Element}
              setIsOpen={() => dispatch(setRightSheet(RightSheets.Element))}
              side="right"
              buttonProps={{
                noStyle: true,
                className: 'tool-container mini square',
                tooltipId: RightSheets.Element,
                children: (
                  <SettingsIcon
                    className={clsx(
                      'own-color',
                      rightSheet?.type === RightSheets.Element && 'active',
                    )}
                  />
                ),
              }}
            >
              <ElementPanel />
            </Sheet>
            <Popover
              button={
                <MainButton noStyle className="tool-container mini square" tooltipId="help">
                  <QuestionIcon />
                </MainButton>
              }
              className="col mini-gap"
            >
              <h3 className="content-title mini t-art t-center">Shortcuts</h3>
              <hr />
              <div>
                {shortcuts.map((s, i) => (
                  <div key={i} className="row mini-gap">
                    <div
                      style={{
                        color: 'var(--accent-font-color)',
                        fontWeight: 'bold',
                        width: '65px',
                      }}
                    >
                      {s.sc}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>{s.explanation}</div>
                  </div>
                ))}
              </div>
            </Popover>
          </div>
        )}
      </div>
    </div>
  );
};
