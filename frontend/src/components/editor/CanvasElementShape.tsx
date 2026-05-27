import { useCallback, useMemo, useRef, useState } from 'react';
import { Arrow, Ellipse, Image, Line, Rect, RegularPolygon, Star, Text } from 'react-konva';
import { useImage } from 'react-konva-utils';

import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';

import { selectEditor, updateCanvasElements } from '@store/editorSlice';

import selectCursor from '@assets/select.png';

import { useImages } from '@hooks/useImages';
import { useAppDispatch, useAppSelector } from '@hooks/utilHooks';

import { DEFAULT_BORDER_COLOR } from '@utils/constants';

import {
  Actions,
  BrushTypes,
  type CanvasElement,
  CanvasElements,
  Tools,
} from '@mytypes/editorTypes';

interface CanvasImageProps {
  el: any;
  baseProps?: any;
}

export const CanvasImage = ({ el, baseProps }: CanvasImageProps) => {
  const imagesCtx = useImages();
  const url = useMemo(
    () => imagesCtx?.findImageItem(el.image ?? '')?.url ?? '',
    [el.image, imagesCtx],
  );
  const [image] = useImage(url, url.startsWith('blob:') ? undefined : 'anonymous');

  if (!image) {
    if (el.type === CanvasElements.Background) return;
    return (
      <Rect
        {...el}
        {...baseProps}
        fill="transparent"
        stroke={DEFAULT_BORDER_COLOR}
        dash={[2, 2]}
        strokeWidth={1}
      />
    );
  }

  if (el.type === CanvasElements.Background)
    return <Image width={el.width} height={el.height} image={image} listening={false} />;

  return <Image {...el} image={image} {...baseProps} />;
};

interface CanvasElementShapeProps {
  element: CanvasElement;
}

export const CanvasText = ({ el, baseProps }: CanvasImageProps) => {
  const dispatch = useAppDispatch();
  const [textWidth, setTextWidth] = useState(el.width);
  const [textHeight, setTextHeight] = useState(el.heifgr);
  const textRef = useRef<Konva.Text | null>(null);

  const handleTransform = useCallback(() => {
    const node = textRef.current;
    if (!node) return;
    const scaleX = node.scaleX();
    const newWidth = node.width() * scaleX;
    setTextWidth(newWidth);
    const scaleY = node.scaleY();
    const newHeight = node.height() * scaleY;
    setTextHeight(newHeight);
    node.setAttrs({
      width: newWidth,
      scaleX: 1,
      height: newHeight,
      scaleY: 1,
    });
  }, []);

  const handleTransformEnd = useCallback(() => {
    if (textRef.current)
      dispatch(
        updateCanvasElements({
          updates: [
            {
              id: textRef.current.id(),
              changes: {
                width: textRef.current.width(),
                scaleX: 1,
                height: textRef.current.height(),
                scaleY: 1,
              },
            },
          ],
          action: Actions.Resize,
        }),
      );
  }, []);
  return (
    <Text
      {...el}
      {...baseProps}
      width={textWidth}
      height={textHeight}
      ref={textRef}
      onTransform={handleTransform}
      onTransformEnd={handleTransformEnd}
    />
  );
};

export const CanvasElementShape = ({ element: el }: CanvasElementShapeProps) => {
  const tool = useAppSelector(selectEditor.tool);
  const baseProps = {
    name:
      el.type === CanvasElements.Drawing && el.brushType === BrushTypes.Eraser
        ? 'eraser'
        : 'element',
    onMouseOver: (e: KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (stage && tool === Tools.Select) stage.container().style.cursor = 'pointer';
    },
    onMouseLeave: (e: KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (stage && tool === Tools.Select)
        stage.container().style.cursor = `url(${selectCursor}), default`;
    },
  };

  switch (el.type) {
    case CanvasElements.Rectangle:
      return <Rect {...el} {...baseProps} />;
    case CanvasElements.Ellipse:
      return <Ellipse {...el} {...baseProps} />;
    case CanvasElements.Triangle:
    case CanvasElements.Pentagon:
    case CanvasElements.Polygon:
      return <RegularPolygon {...el} {...baseProps} />;
    case CanvasElements.Star:
      return <Star {...el} {...baseProps} />;
    case CanvasElements.Line:
      return <Line {...el} {...baseProps} />;
    case CanvasElements.Arrow:
      return <Arrow {...el} {...baseProps} />;
    case CanvasElements.Drawing:
      return <Line {...el} {...baseProps} shadowColor={el.stroke} perfectDrawEnabled={false} />;
    case CanvasElements.Image:
      return <CanvasImage el={el} baseProps={baseProps} />;
    case CanvasElements.Text:
      return <CanvasText el={el} baseProps={baseProps} />;
    default:
      return <></>;
  }
};
