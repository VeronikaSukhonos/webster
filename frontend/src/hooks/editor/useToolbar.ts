import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';

import { addCanvasElement, selectEditor, setSelectedIds } from '@store/editorSlice';

import brushCursor from '@assets/brush.png';
import grabCursor from '@assets/grab.png';
import grabbingCursor from '@assets/grabbing.png';
import markerCursor from '@assets/marker.png';
import pencilCursor from '@assets/pencil.png';
import selectCursor from '@assets/select.png';

import { useAppDispatch, useAppSelector } from '@hooks/utilHooks';

import { DEFAULT_BORDER_COLOR, DEFAULT_BRUSH_PROPS, DEFAULT_PROPS } from '@utils/constants';
import { MAX_SCALE, MIN_SCALE, SCALE_FACTOR } from '@utils/constants';

import { Tools } from '@mytypes/editorTypes';
import type { BrushType, Drawing, Placement } from '@mytypes/editorTypes';

Konva.hitOnDragEnabled = true;
Konva.dragButtons = [0, 2];

const defaultPosition = { x: 0, y: 0 };
const defaultState = { dist: 0, center: null };
const initialSelectRect = { x1: 0, y1: 0, x2: 0, y2: 0, visible: false };

export const useToolbar = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const dispatch = useAppDispatch();

  const tool = useAppSelector(selectEditor.tool);
  const selectedIds = useAppSelector(selectEditor.selected);

  const lastUsedStyle = useAppSelector(selectEditor.lastUsedStyle);

  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [selectGroupPos, setSelectGroupPos] = useState(defaultPosition);

  const prevStateRef = useRef<{ dist: number; center: Placement | null }>(defaultState);
  const hasDragStoppedRef = useRef(false);

  const transformerRef = useRef<Konva.Transformer | null>(null);
  const backdropRef = useRef<Konva.Rect | null>(null);
  const [selectRect, setSelectRect] = useState(initialSelectRect);
  // const selectRectRef = useRef<Konva.Rect | null>(null);
  const selectGroupRef = useRef<Konva.Group | null>(null);
  const isSelectingRef = useRef(false);
  const isRightRef = useRef(false);

  const drawingLine = useRef<Drawing | null>(null);
  const drawingLineRef = useRef<Konva.Line | null>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    if (tool !== Tools.Select) dispatch(setSelectedIds([]));
    const stage = stageRef.current;
    if (!stage) return;

    if (tool === Tools.Grab || isDragging)
      stage.container().style.cursor = isDragging
        ? `url(${grabbingCursor}), grabbing`
        : `url(${grabCursor}), grab`;
    else if (tool === Tools.Select)
      stage.container().style.cursor = `url(${selectCursor}), default`;
    else if (tool === Tools.Text) stage.container().style.cursor = 'crosshair';
    else if (tool === Tools.Pencil || tool === Tools.Eraser)
      stage.container().style.cursor = `url(${pencilCursor}), pointer`;
    else if (tool === Tools.Marker)
      stage.container().style.cursor = `url(${markerCursor}), pointer`;
    else if (tool === Tools.Brush) stage.container().style.cursor = `url(${brushCursor}), pointer`;
  }, [tool, isDragging]);

  useEffect(() => {
    if (!stageRef.current || !transformerRef.current) return;

    const selected = selectedIds.filter((id) => id !== 'background');

    if (selected.length === 0) transformerRef.current.nodes([]);
    else if (selectGroupRef.current) transformerRef.current.nodes([selectGroupRef.current]);
  }, [selectedIds]);

  const calcSelectBox = useCallback(() => {
    return {
      x: Math.min(selectRect.x1, selectRect.x2),
      y: Math.min(selectRect.y1, selectRect.y2),
      width: Math.abs(selectRect.x2 - selectRect.x1),
      height: Math.abs(selectRect.y2 - selectRect.y1),
    };
  }, [selectRect]);

  const selectRectProps = useMemo(() => {
    return {
      fill: '#b1cbf480',
      stroke: DEFAULT_BORDER_COLOR,
      strokeWidth: 1 / stageScale,
      ...calcSelectBox(),
      visible: selectRect.visible,
    };
  }, [selectRect, stageScale]);

  const setStageZoom = ({
    direction = 1,
    newScale,
    zoomCenter,
  }: {
    direction?: number;
    newScale?: number;
    zoomCenter?: Placement;
  }) => {
    const stage = stageRef.current;
    if (!stage) return;

    const prevScale = stage.scaleX();
    let dx = 0,
      dy = 0;

    if (zoomCenter && newScale && prevStateRef.current.center) {
      ((dx = zoomCenter.x - prevStateRef.current.center.x),
        (dy = zoomCenter.y - prevStateRef.current.center.y));
      newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    } else {
      zoomCenter = { x: stage.width() / 2, y: stage.height() / 2 };

      if (!newScale) {
        const p = stage.getPointerPosition();
        if (!p) return;

        newScale = Math.max(
          MIN_SCALE,
          Math.min(MAX_SCALE, direction > 0 ? prevScale * SCALE_FACTOR : prevScale / SCALE_FACTOR),
        );
        zoomCenter = p;
      }
    }
    const pointTo = {
      x: (zoomCenter.x - stage.x()) / prevScale,
      y: (zoomCenter.y - stage.y()) / prevScale,
    };
    const position = {
      x: zoomCenter.x - pointTo.x * newScale + dx,
      y: zoomCenter.y - pointTo.y * newScale + dy,
    };

    stage.scale({ x: newScale, y: newScale });
    stage.position(position);
    setStageScale(newScale);
    setStagePos(position);
  };

  const resetSelectGroup = useCallback(() => {
    if (!selectGroupRef.current) return;
    selectGroupRef.current.position(defaultPosition);
    selectGroupRef.current.scaleX(1);
    selectGroupRef.current.scaleY(1);
    selectGroupRef.current.rotation(0);
    setSelectGroupPos(defaultPosition);
  }, [selectGroupRef.current]);

  const clearPrevSelection = useCallback((id?: string) => {
    dispatch(setSelectedIds(id ? [id] : []));
    resetSelectGroup();
  }, []);

  const startSelectGroup = useCallback(
    (e: KonvaEventObject<TouchEvent | MouseEvent>) => {
      if (e.target.getParent() === transformerRef.current) return;
      const stage = stageRef.current;
      if (!stage) return;

      if (e.target === stage || e.target.id() === 'background') {
        const p = stage.getRelativePointerPosition();
        if (!p) return;
        clearPrevSelection();
        setSelectRect({ x1: p.x, y1: p.y, x2: p.x, y2: p.y, visible: true });
        isSelectingRef.current = true;
      } else {
        const id = e.target.id();
        if (id && !selectedIds.includes(id)) clearPrevSelection(id);
      }
    },
    [stageRef.current, selectGroupRef.current, transformerRef.current, selectedIds],
  );

  const applySelectGroup = useCallback(() => {
    if (!stageRef.current) return;
    const box = calcSelectBox();

    if (box.width > 2 || box.height > 2) {
      const stage = stageRef.current;
      const elements = stageRef.current.find('.element');
      const ids: string[] = [];

      elements.forEach((el: Konva.Node) => {
        const id = el.id();
        if (Konva.Util.haveIntersection(box, el.getClientRect({ relativeTo: stage }))) ids.push(id);
      });
      dispatch(setSelectedIds(ids));
    }
    setSelectRect(initialSelectRect);
  }, [calcSelectBox, stageRef.current]);

  const startDrawing = useCallback(
    (e: KonvaEventObject<TouchEvent | MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;

      const p = stage.getRelativePointerPosition();
      if (!p) return;
      const brushProps = DEFAULT_BRUSH_PROPS[tool as BrushType];
      const isEraser = tool === Tools.Eraser;
      const el: Drawing = {
        id: crypto.randomUUID(),
        ...DEFAULT_PROPS.drawing,
        ...brushProps,
        stroke: isEraser ? '#000000' : lastUsedStyle.stroke,
        strokeWidth: lastUsedStyle.strokeWidth || brushProps.strokeWidth,
        globalCompositeOperation: isEraser ? 'destination-out' : 'source-over',
        points: [p.x, p.y + (e.evt.type === 'mousedown' ? 16 : 0)],
      };
      drawingLine.current = el;
      drawingLineRef.current?.setAttrs({ ...el, visible: true });
      isDrawing.current = true;
    },
    [
      stageRef.current,
      tool,
      lastUsedStyle,
      drawingLine.current,
      drawingLineRef.current,
      isDrawing.current,
    ],
  );

  const continueDrawing = useCallback(
    (e: KonvaEventObject<TouchEvent | MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;

      const p = stage.getRelativePointerPosition();
      if (!isDrawing.current || !drawingLine.current || !p) return;
      e.evt.preventDefault();
      const tmp = drawingLine.current;
      drawingLine.current = {
        ...tmp,
        points: [...tmp.points, p.x, p.y + (e.evt.type === 'mousemove' ? 16 : 0)],
      };
      drawingLineRef.current?.setAttrs(drawingLine.current);
    },
    [stageRef.current, drawingLine.current, drawingLineRef.current, isDrawing.current],
  );

  const finishDrawing = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    if (!isDrawing.current || !drawingLine.current) return;
    isDrawing.current = false;
    dispatch(addCanvasElement(drawingLine.current));
    drawingLine.current = null;
    drawingLineRef.current?.setAttrs({
      points: [],
      visible: false,
      globalCompositeOperation: 'source-over',
    });
    drawingLineRef.current?.getLayer()?.batchDraw();
  }, [stageRef.current, drawingLine.current, drawingLineRef.current, isDrawing.current]);

  const onWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    let direction = e.evt.deltaY > 0 ? -1 : 1;
    if (e.evt.ctrlKey) direction = -direction;
    setStageZoom({ direction });
  };

  const onTouchStart = (e: KonvaEventObject<TouchEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const [t1, t2] = e.evt.touches;

    if (t1 && !t2) {
      switch (tool) {
        case Tools.Select:
          startSelectGroup(e);
          break;
        case Tools.Text:
          const p = stage.getRelativePointerPosition();
          if (!p) return;
          setSelectRect({ x1: p.x, y1: p.y, x2: p.x, y2: p.y, visible: true });
          isSelectingRef.current = true;
          break;
        case Tools.Pencil:
        case Tools.Marker:
        case Tools.Brush:
        case Tools.Eraser:
          startDrawing(e);
          break;
      }
    }
  };

  const onTouchMove = (e: KonvaEventObject<TouchEvent>) => {
    e.evt.preventDefault();
    const [t1, t2] = e.evt.touches;
    const stage = stageRef.current;
    if (!stage) return;

    if (t1 && t2) {
      if (stage.isDragging()) {
        stage.stopDrag();
        hasDragStoppedRef.current = true;
      }

      const { left, top } = stage.container().getBoundingClientRect();
      const p1 = { x: t1.clientX - left, y: t1.clientY - top },
        p2 = { x: t2.clientX - left, y: t2.clientY - top };
      const zoomCenter = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

      if (!prevStateRef.current.center) {
        prevStateRef.current.center = zoomCenter;
        return;
      }
      const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

      if (!prevStateRef.current.dist) {
        prevStateRef.current.dist = dist;
        return;
      }

      setStageZoom({ zoomCenter, newScale: stage.scaleX() * (dist / prevStateRef.current.dist) });
      prevStateRef.current = { dist, center: zoomCenter };
      return;
    }

    if (t1 && !t2) {
      switch (tool) {
        case Tools.Select:
        case Tools.Text:
          if (stage.isDragging()) {
            stage.stopDrag();
            hasDragStoppedRef.current = true;
          }
          if (!isSelectingRef.current) return;
          const p = stage.getRelativePointerPosition();
          if (p) setSelectRect((rect) => ({ ...rect, x2: p.x, y2: p.y }));
          break;
        case Tools.Grab:
          if (!stage.isDragging() && hasDragStoppedRef) {
            stage.startDrag();
            hasDragStoppedRef.current = false;
          }
          break;
        case Tools.Pencil:
        case Tools.Marker:
        case Tools.Brush:
        case Tools.Eraser:
          continueDrawing(e);
          break;
      }
    }
  };

  const onTouchEnd = () => {
    prevStateRef.current = defaultState;

    switch (tool) {
      case Tools.Select:
        if (!isSelectingRef.current) return;
        isSelectingRef.current = false;
        applySelectGroup();
        break;
      case Tools.Text:
        isSelectingRef.current = false;
        const box = calcSelectBox();

        if (box.width > 2 || box.height > 2) {
          // TODO draw text rect with this size // probably move this to separate function and use it in touchend
        } else {
          // draw text rect with some default size
        }
        setSelectRect(initialSelectRect);
        break;
      case Tools.Pencil:
      case Tools.Marker:
      case Tools.Brush:
      case Tools.Eraser:
        finishDrawing();
    }
  };

  const onDragEnd = () => {
    hasDragStoppedRef.current = false;
    if (!stageRef.current) return;
    setStagePos({ x: stageRef.current.x(), y: stageRef.current.y() });
  };

  const onClick = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!stageRef.current) return;

    if (tool === Tools.Select) {
      if (e.target.getParent() === selectGroupRef.current) {
        const id = e.target.id();
        if (id) clearPrevSelection(id);
      }
    }
  };

  const onMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    if (e.evt.button === 0) {
      switch (tool) {
        case Tools.Select:
          startSelectGroup(e);
          break;
        case Tools.Grab:
          setIsDragging(true);
          break;
        case Tools.Text:
          const p = stage.getRelativePointerPosition();
          if (!p) return;
          setSelectRect({ x1: p.x, y1: p.y, x2: p.x, y2: p.y, visible: true });
          isSelectingRef.current = true;
          break;
        case Tools.Pencil:
        case Tools.Marker:
        case Tools.Brush:
        case Tools.Eraser:
          startDrawing(e);
          break;
      }
    } else if (e.evt.button === 2) {
      isRightRef.current = true;
      stage.setDraggable(true);
    }
  };

  const onMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!stageRef.current) return;

    if (isRightRef.current) {
      if (stageRef.current.isDragging()) setIsDragging(true);
    } else {
      switch (tool) {
        case Tools.Select:
        case Tools.Text:
          const p = stageRef.current.getRelativePointerPosition();
          if (!isSelectingRef.current) return;
          if (p) setSelectRect((rect) => ({ ...rect, x2: p.x, y2: p.y }));
          break;
        case Tools.Pencil:
        case Tools.Marker:
        case Tools.Brush:
        case Tools.Eraser:
          continueDrawing(e);
          break;
      }
    }
  };

  const onMouseUp = (e: KonvaEventObject<MouseEvent>) => {
    if (!stageRef.current) return;

    if (e.evt.button === 0) {
      switch (tool) {
        case Tools.Select:
          if (!isSelectingRef.current) return;
          isSelectingRef.current = false;
          applySelectGroup();
          break;
        case Tools.Grab:
          setIsDragging(false);
          break;
        case Tools.Text:
          isSelectingRef.current = false;
          const box = calcSelectBox();

          if (box.width > 2 || box.height > 2) {
            // TODO draw text rect with this size // probably move this to separate function and use it in touchend
          } else {
            // draw text rect with some default size
          }
          setSelectRect(initialSelectRect);
          break;
        case Tools.Pencil:
        case Tools.Marker:
        case Tools.Brush:
        case Tools.Eraser:
          finishDrawing();
      }
    } else if (e.evt.button === 2) {
      setIsDragging(false);
      isRightRef.current = false;
      if (tool !== Tools.Grab) stageRef.current.setDraggable(false);
    }
  };

  // const onTransformEnd = (e) => {

  // };

  return {
    stagePos,
    stageZoom: stageScale,
    setStageZoom,
    selectRectProps,
    transformerRef,
    backdropRef,
    selectGroupRef,
    selectGroupPos,
    setSelectGroupPos,
    drawingLineRef,
    // onTransformEnd,
    onWheel,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onDragEnd,
    onClick,
    onTap: onClick,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave: onMouseUp,
    onContextmenu: (e: KonvaEventObject<MouseEvent>) => e.evt.preventDefault(),
  };
};
