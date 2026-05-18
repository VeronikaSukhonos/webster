import { useEffect, useState } from 'react';

import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';

import { useDebounce } from '@hooks/useDebounce';

import { MAX_SCALE, MIN_SCALE, SCALE_FACTOR } from '@utils/constants';

import type { Size } from '@mytypes/editorTypes';

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
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState(defaultPosition);

  const setStageZoom = ({ direction = 1, newScale }: { direction?: number; newScale?: number }) => {
    const stage = stageRef.current;
    if (!stage) return;

    const prevScale = stage.scaleX();
    let zoomCenter = { x: stage.width() / 2, y: stage.height() / 2 };

    if (!newScale) {
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      newScale = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, direction > 0 ? prevScale * SCALE_FACTOR : prevScale / SCALE_FACTOR),
      );
      zoomCenter = pointer;
    }
    const pointTo = {
      x: (zoomCenter.x - stage.x()) / prevScale,
      y: (zoomCenter.y - stage.y()) / prevScale,
    };
    const position = {
      x: zoomCenter.x - pointTo.x * newScale,
      y: zoomCenter.y - pointTo.y * newScale,
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

  return { stageZoom: stageScale, setStageZoom, stagePos, onWheel };
};
