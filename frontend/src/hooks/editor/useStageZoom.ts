import { useEffect, useRef, useState } from 'react';

import Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';

import { useDebounce } from '@hooks/useDebounce';

import { MAX_SCALE, MIN_SCALE, SCALE_FACTOR } from '@utils/constants';

import type { Placement, Size } from '@mytypes/editorTypes';

Konva.hitOnDragEnabled = true;

export const useStageSize = () => {
  const [innerStageSize, setStageSize] = useState<Size>({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const stageSize = useDebounce(innerStageSize, 500);

  useEffect(() => {
    const updateSize = () => {
      setStageSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', updateSize);

    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  return { stageSize };
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
    } else {
      zoomCenter = { x: stage.width() / 2, y: stage.height() / 2 };

      if (!newScale) {
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        newScale = Math.max(
          MIN_SCALE,
          Math.min(MAX_SCALE, direction > 0 ? prevScale * SCALE_FACTOR : prevScale / SCALE_FACTOR),
        );
        zoomCenter = pointer;
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
      const prevScale = stage.scaleX();
      const newScale = prevScale * (dist / prevState.current.dist);

      setStageZoom({ zoomCenter, newScale });
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
