import { useMemo } from 'react';
import { Image, Line, Rect } from 'react-konva';
import { useImage } from 'react-konva-utils';

import { selectEditor } from '@store/editorSlice';

import { useImages } from '@hooks/useImages';
import { useAppSelector } from '@hooks/utilHooks';

import { DEFAULT_BORDER_COLOR } from '@utils/constants';

import { type CanvasElement, CanvasElements, Tools } from '@mytypes/editorTypes';

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
  preventDrag?: boolean;
}

export const CanvasElementShape = ({
  element: el,
  preventDrag = false,
}: CanvasElementShapeProps) => {
  // const dispatch = useAppDispatch();

  const tool = useAppSelector(selectEditor.tool);
  // const selectedIds = useAppSelector(selectEditor.selected);

  const baseProps = {
    name: 'element',
    draggable: preventDrag ? false : el.locked ? false : tool === Tools.Select,
  };

  switch (el.type) {
    case CanvasElements.Drawing:
      return <Line {...el} {...baseProps} perfectDrawEnabled={false} />;
    case CanvasElements.Image:
      return <CanvasImage el={el} baseProps={baseProps} />;
    default:
      return <></>;
  }
};
