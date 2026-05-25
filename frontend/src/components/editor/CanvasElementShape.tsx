import { useMemo } from 'react';
import { Arrow, Ellipse, Image, Line, Rect, RegularPolygon, Star } from 'react-konva';
import { useImage } from 'react-konva-utils';

import { useImages } from '@hooks/useImages';

import { DEFAULT_BORDER_COLOR } from '@utils/constants';

import { BrushTypes, type CanvasElement, CanvasElements } from '@mytypes/editorTypes';

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
  const [image] = useImage(url, 'anonymous');

  if (!image) {
    if (el.type === CanvasElements.Background) return;
    return (
      <Rect
        {...el}
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

export const CanvasElementShape = ({ element: el }: CanvasElementShapeProps) => {
  const baseProps = {
    name:
      el.type === CanvasElements.Drawing && el.brushType === BrushTypes.Eraser
        ? 'eraser'
        : 'element',
  };

  switch (el.type) {
    case CanvasElements.Rectangle:
      return <Rect {...el} {...baseProps} />;
    case CanvasElements.Ellipse:
      return <Ellipse {...el} {...baseProps} />;
    case CanvasElements.Polygon:
      return <RegularPolygon {...el} {...baseProps} />;
    case CanvasElements.Star:
      return <Star {...el} {...baseProps} />;
    case CanvasElements.Line:
      return <Line {...el} {...baseProps} />;
    case CanvasElements.Arrow:
      return <Arrow {...el} {...baseProps} />;
    case CanvasElements.Drawing:
      return <Line {...el} {...baseProps} perfectDrawEnabled={false} />;
    case CanvasElements.Image:
      return <CanvasImage el={el} baseProps={baseProps} />;
    default:
      return <></>;
  }
};
