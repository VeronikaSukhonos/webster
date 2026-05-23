import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';

import { selectEditor, setSelectedIds } from '@store/editorSlice';

import brushCursor from '@assets/brush.png';
import grabCursor from '@assets/grab.png';
import grabbingCursor from '@assets/grabbing.png';
import markerCursor from '@assets/marker.png';
import pencilCursor from '@assets/pencil.png';
import selectCursor from '@assets/select.png';

import { useAppDispatch, useAppSelector } from '@hooks/utilHooks';

import { DEFAULT_BORDER_COLOR } from '@utils/constants';
import { MAX_SCALE, MIN_SCALE, SCALE_FACTOR } from '@utils/constants';

import { Tools } from '@mytypes/editorTypes';
import type { Placement } from '@mytypes/editorTypes';

Konva.hitOnDragEnabled = true;
Konva.dragButtons = [0, 2];

export const useToolbar = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const dispatch = useAppDispatch();

  const tool = useAppSelector(selectEditor.tool);
  const selectedIds = useAppSelector(selectEditor.selected);

  const initialSelectRect = { x1: 0, y1: 0, x2: 0, y2: 0, visible: false };
  const [selectRect, setSelectRect] = useState(initialSelectRect);

  const [isDragging, setIsDragging] = useState(false);

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
      strokeWidth: 1,
      ...calcSelectBox(),
      visible: selectRect.visible,
    };
  }, [selectRect]);

  const transformerRef = useRef<Konva.Transformer | null>(null);
  const selectGroupRef = useRef<Konva.Group | null>(null);
  const isSelectingRef = useRef(false);
  const isRightRef = useRef(false);

  useEffect(() => {
    if (tool !== Tools.Select) dispatch(setSelectedIds([]));
    if (!stageRef.current) return;

    if (tool === Tools.Grab || isDragging)
      stageRef.current.container().style.cursor = isDragging
        ? `url(${grabbingCursor}), grabbing`
        : `url(${grabCursor}), grab`;
    else if (tool === Tools.Select)
      stageRef.current.container().style.cursor = `url(${selectCursor}), default`;
    else if (tool === Tools.Text) stageRef.current.container().style.cursor = 'crosshair';
    else if (tool === Tools.Pencil)
      stageRef.current.container().style.cursor = `url(${pencilCursor}), pointer`;
    else if (tool === Tools.Marker)
      stageRef.current.container().style.cursor = `url(${markerCursor}), pointer`;
    else if (tool === Tools.Brush)
      stageRef.current.container().style.cursor = `url(${brushCursor}), pointer`;
  }, [tool, isDragging]);

  useEffect(() => {
    if (!stageRef.current || !transformerRef.current) return;

    const selected = selectedIds.filter((id) => id !== 'background');

    if (selected.length === 0) {
      transformerRef.current.nodes([]);
    } else if (selected.length === 1) {
      const element = stageRef.current.findOne(`#${selected[0]}`);
      if (!element) return;
      transformerRef.current.nodes([element]);
    } else if (selectGroupRef.current) {
      transformerRef.current.nodes([selectGroupRef.current]);
    }
  }, [selectedIds]);

  const resetSelectGroup = useCallback(() => {
    if (!selectGroupRef.current) return;
    selectGroupRef.current.position({ x: 0, y: 0 });
    selectGroupRef.current.scaleX(1);
    selectGroupRef.current.scaleY(1);
    selectGroupRef.current.rotation(0);
  }, [selectGroupRef.current]);

  const clearPrevSelection = useCallback((id?: string) => {
    dispatch(setSelectedIds(id ? [id] : []));
    resetSelectGroup();
  }, []);

  const onClick = (e: KonvaEventObject<MouseEvent>) => {
    if (!stageRef.current) return;

    if (tool === Tools.Select) {
      if (e.target.getParent() === selectGroupRef.current) {
        const id = e.target.id();
        if (id) clearPrevSelection(id);
      }
    }
  };

  const onMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (!stageRef.current) return;

    if (e.evt.button === 0) {
      if (tool === Tools.Select) {
        if (e.target.getParent() === transformerRef.current) return;

        if (e.target === stageRef.current) {
          const p = stageRef.current.getRelativePointerPosition();
          if (!p) return;
          clearPrevSelection();
          setSelectRect({ x1: p.x, y1: p.y, x2: p.x, y2: p.y, visible: true });
          isSelectingRef.current = true;
        } else if (e.target.getParent() !== selectGroupRef.current) {
          const id = e.target.id();
          if (id && !selectedIds.includes(id)) clearPrevSelection(id);
        }
      } else if (tool === Tools.Grab) {
        setIsDragging(true);
      } else if (tool === Tools.Text) {
        const p = stageRef.current.getRelativePointerPosition();
        if (!p) return;
        setSelectRect({ x1: p.x, y1: p.y, x2: p.x, y2: p.y, visible: true });
        isSelectingRef.current = true;
      }
    } else if (e.evt.button === 2) {
      isRightRef.current = true;
      stageRef.current.setDraggable(true);
    }
  };

  const onMouseMove = () => {
    if (!stageRef.current) return;

    if (isRightRef.current) {
      if (stageRef.current.isDragging()) setIsDragging(true);
    } else if (tool === Tools.Select || tool === Tools.Text) {
      if (!isSelectingRef.current) return;
      const p = stageRef.current.getRelativePointerPosition();
      if (p) setSelectRect((rect) => ({ ...rect, x2: p.x, y2: p.y }));
    }
  };

  const onMouseUp = (e: KonvaEventObject<MouseEvent>) => {
    if (!stageRef.current) return;

    if (e.evt.button === 0) {
      if (tool === Tools.Select) {
        if (!isSelectingRef.current) return;
        isSelectingRef.current = false;
        const box = calcSelectBox();

        if (box.width > 2 || box.height > 2) {
          const elements = stageRef.current.find('.element');
          const ids: string[] = [];

          elements.forEach((el: Konva.Node) => {
            const id = el.id();
            if (Konva.Util.haveIntersection(box, el.getClientRect())) ids.push(id);
          });
          dispatch(setSelectedIds(ids));
        }
        setSelectRect(initialSelectRect);
      } else if (tool === Tools.Grab) {
        setIsDragging(false);
      } else if (tool === Tools.Text) {
        isSelectingRef.current = false;
        const box = calcSelectBox();

        if (box.width > 2 || box.height > 2) {
          //
        } else {
        }
        setSelectRect(initialSelectRect);
      }
    } else if (e.evt.button === 2) {
      setIsDragging(false);
      isRightRef.current = false;
      stageRef.current.setDraggable(false);
    }
  };

  return {
    selectRectProps,
    transformerRef,
    selectGroupRef,
    onClick,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave: onMouseUp,
    onContextmenu: (e: KonvaEventObject<MouseEvent>) => e.evt.preventDefault(),
  };
};

export const useStageZoom = (stageRef: React.RefObject<Konva.Stage | null>) => {
  const defaultPosition = { x: 0, y: 0 };
  const defaultState = { dist: 0, center: null };

  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState(defaultPosition);

  const prevState = useRef<{ dist: number; center: Placement | null }>(defaultState);
  const hasDragStopped = useRef(false);

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

    if (zoomCenter && newScale && prevState.current.center) {
      ((dx = zoomCenter.x - prevState.current.center.x),
        (dy = zoomCenter.y - prevState.current.center.y));
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

  const onWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    let direction = e.evt.deltaY > 0 ? -1 : 1;
    if (e.evt.ctrlKey) direction = -direction;
    setStageZoom({ direction });
  };

  const onTouchMove = (e: KonvaEventObject<TouchEvent>) => {
    e.evt.preventDefault();
    const [t1, t2] = e.evt.touches;
    const stage = stageRef.current;
    if (!stage) return;

    if (t1 && t2) {
      if (stage.isDragging()) {
        stage.stopDrag();
        hasDragStopped.current = true;
      }

      const { left, top } = stage.container().getBoundingClientRect();
      const p1 = { x: t1.clientX - left, y: t1.clientY - top },
        p2 = { x: t2.clientX - left, y: t2.clientY - top };
      const zoomCenter = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

      if (!prevState.current.center) {
        prevState.current.center = zoomCenter;
        return;
      }
      const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

      if (!prevState.current.dist) {
        prevState.current.dist = dist;
        return;
      }

      setStageZoom({ zoomCenter, newScale: stage.scaleX() * (dist / prevState.current.dist) });
      prevState.current = { dist, center: zoomCenter };
    }

    if (t1 && !t2 && !stage.isDragging() && hasDragStopped) {
      stage.startDrag();
      hasDragStopped.current = false;
    }
  };

  const onTouchEnd = () => {
    prevState.current = defaultState;
  };

  const onDragEnd = () => {
    hasDragStopped.current = false;
    if (!stageRef.current) return;
    setStagePos({ x: stageRef.current.x(), y: stageRef.current.y() });
  };

  return {
    stageZoom: stageScale,
    setStageZoom,
    stagePos,
    onWheel,
    onTouchMove,
    onTouchEnd,
    onDragEnd,
  };
};
