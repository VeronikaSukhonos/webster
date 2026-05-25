import { useEffect, useMemo, useRef } from 'react';
import { Group, Layer, Line, Rect, Stage, Transformer } from 'react-konva';

import clsx from 'clsx';
import type { KonvaEventObject } from 'konva/lib/Node';

import {
  addCanvasElements,
  deleteCanvasElements,
  moveCanvasElements,
  selectEditor,
  setCanvasSize,
  setLeftSheet,
  setSelectedIds,
} from '@store/editorSlice';

import { NumberField, SizeField } from '@components/InputFields';
import { MainButton } from '@components/MainButton';
import { Popover } from '@components/Menu';
import { CanvasElementShape, CanvasImage } from '@components/editor/CanvasElementShape';
import { LayersPanel } from '@components/editor/LeftPanels';
import { Sheet } from '@components/editor/Sheet';
import { Toolbar } from '@components/editor/Toolbar';

import { LayerIcon, QuestionIcon } from '@assets/index';

import { useStageSize } from '@hooks/editor/useStageSize';
import { useToolbar } from '@hooks/editor/useToolbar';
import { useAppDispatch, useAppSelector } from '@hooks/utilHooks';

import {
  DEFAULT_BORDER_COLOR,
  MAX_CANVAS_SIZE,
  MAX_SCALE,
  MIN_CANVAS_SIZE,
  MIN_SCALE,
} from '@utils/constants';
import { shortcuts } from '@utils/shortcuts';

import {
  type CanvasElement,
  type CanvasProps,
  LeftSheets,
  Modes,
  Tools,
} from '@mytypes/editorTypes';

import './Editor.css';

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;

  return !!target.closest('input, textarea, select, [contenteditable="true"]');
};

const cloneCanvasElement = (element: CanvasElement, offset = 0): CanvasElement => {
  const clone = structuredClone(element);

  return { ...clone, id: crypto.randomUUID(), x: clone.x + offset, y: clone.y + offset };
};

export const Editor = ({ stageRef, backgroundRef }: CanvasProps) => {
  const dispatch = useAppDispatch();
  const clipboardRef = useRef<CanvasElement[]>([]);

  const canvas = useAppSelector(selectEditor.canvas);
  const selectedIds = useAppSelector(selectEditor.selected);
  const tool = useAppSelector(selectEditor.tool);
  const mode = useAppSelector(selectEditor.mode);
  const leftSheet = useAppSelector(selectEditor.leftSheet);
  const project = useAppSelector(selectEditor.project);

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
    drawingLine,
    drawingLineRef,
    // onTransformEnd,
    ...toolbarHandlers
  } = useToolbar(stageRef);

  useEffect(() => {
    if (!backdropRef.current) return;
    if (!selectGroupRef.current || selectedIds.length === 0) {
      backdropRef.current.setAttrs({ x: 0, y: 0, width: 0, height: 0 });
      return;
    }
    const { x, y, width, height } = selectGroupRef.current.getClientRect({
      relativeTo: selectGroupRef.current,
    });
    backdropRef.current.setAttrs({ x, y, width, height });
    selectGroupRef.current.position(selectGroupPos);
  }, [selectedIds, canvas.elements]);

  useEffect(() => {
    if (mode !== Modes.Edit) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;

      const selectedElementIds = selectedIds.filter((id) =>
        canvas.elements.some((el) => el.id === id),
      );
      const selectedElements = canvas.elements.filter((el) => selectedElementIds.includes(el.id));

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && selectedElements.length) {
        e.preventDefault();
        clipboardRef.current = structuredClone(selectedElements);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x' && selectedElements.length) {
        e.preventDefault();
        clipboardRef.current = structuredClone(selectedElements);
        dispatch(deleteCanvasElements());
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && clipboardRef.current.length) {
        e.preventDefault();
        const pastedElements = clipboardRef.current.map((el) => cloneCanvasElement(el, 10));

        clipboardRef.current = structuredClone(pastedElements);
        dispatch(addCanvasElements(pastedElements));
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        dispatch(setSelectedIds(canvas.elements.map((el) => el.id)));
        return;
      }

      if (e.key === 'Escape' && selectedIds.length) {
        e.preventDefault();
        dispatch(setSelectedIds([]));
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementIds.length) {
        e.preventDefault();
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

        dispatch(moveCanvasElements({ moveX: move.moveX * step, moveY: move.moveY * step }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canvas.elements, dispatch, mode, selectedIds]);

  return (
    <div className="work-area">
      <Toolbar />
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
          {canvas.elements
            .filter((el) => !selectedIds.includes(el.id))
            .map((el) => (
              <CanvasElementShape key={el.id} element={el} />
            ))}
        </Layer>
        <Layer id="drawing-layer" listening={false}>
          <Line {...drawingLine} ref={drawingLineRef} />
        </Layer>
        <Layer id="act-layer" listening={mode !== Modes.View}>
          <Rect
            ref={backdropRef}
            fill="red"
            listening={selectedIds.length > 0}
            draggable
            onDragStart={(e: KonvaEventObject<DragEvent>) => {
              e.target.stopDrag();
              if (selectGroupRef.current) selectGroupRef.current.startDrag();
            }}
          />
          <Group
            id="select-group"
            ref={selectGroupRef}
            draggable={tool === Tools.Select}
            onDragStart={(e: KonvaEventObject<DragEvent>) => {
              setSelectGroupPos({ x: e.target.x(), y: e.target.y() });
            }}
            onDragMove={() => {
              if (!selectGroupRef.current || !backdropRef.current) return;
              const { x, y } = selectGroupRef.current.getClientRect({
                relativeTo: selectGroupRef.current,
              });
              backdropRef.current.setAttrs({ x, y });
            }}
            onDragEnd={(e: KonvaEventObject<DragEvent>) => {
              if (!stageRef.current) return;
              const moveX = e.target.x() - selectGroupPos.x,
                moveY = e.target.y() - selectGroupPos.y;

              if (!moveX && !moveY) return;
              dispatch(moveCanvasElements({ moveX, moveY }));
            }}
          >
            {canvas.elements
              .filter((el) => selectedIds.includes(el.id))
              .map((el) => (
                <CanvasElementShape key={el.id} element={el} />
              ))}
          </Group>
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
            // onTransformEnd={onTransformEnd}
          />
          <Rect {...selectRectProps} />
        </Layer>
      </Stage>

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
            <div className="tool-container mini" style={{ maxWidth: '215px', marginRight: 42 }}>
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
            <Popover
              button={
                <MainButton
                  noStyle
                  className="tool-container mini square"
                  style={{ position: 'fixed', bottom: 10, right: 10 }}
                  tooltipId="help"
                >
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
                        width: '50px',
                      }}
                    >
                      {s.sc}
                    </div>
                    –<div>{s.explanation}</div>
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
