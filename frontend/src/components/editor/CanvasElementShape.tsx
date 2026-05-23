import { Rect } from 'react-konva';

import { selectEditor } from '@store/editorSlice';

import { useAppSelector } from '@hooks/utilHooks';

import { type CanvasElement, Tools } from '@mytypes/editorTypes';

interface CanvasElementShapeProps {
  element: CanvasElement;
  draggable?: boolean;
}

export const CanvasElementShape = ({ element, draggable }: CanvasElementShapeProps) => {
  const tool = useAppSelector(selectEditor.tool);

  return <Rect {...element} draggable={draggable ?? tool === Tools.Select} />;
};
