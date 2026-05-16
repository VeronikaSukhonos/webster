import { useRef } from 'react';
import { Layer, Rect, Stage } from 'react-konva';
import { useImage } from 'react-konva-utils';

import type Konva from 'konva';

import { selectEditor } from '@store/editorSlice';

import { Toolbar } from '@components/editor/Toolbar';

import { useImages } from '@hooks/useImages';
import { useAppSelector } from '@hooks/utilHooks';

import './Editor.css';

interface EditorProps {
  stageRef: React.RefObject<Konva.Stage | null>;
}

export const Editor = ({ stageRef }: EditorProps) => {
  const canvas = useAppSelector(selectEditor.canvas);

  const imagesCtx = useImages();
  const [backgroundImage] = useImage(
    imagesCtx?.findImageItem(canvas.background.fillPatternImage ?? '')?.url ?? '',
    'anonymous',
  );

  const actionsLayerRef = useRef<Konva.Layer | null>(null);

  return (
    <div className="work-area">
      <Toolbar />
      <div className="stage-wrapper">
        <Stage
          width={canvas.background.width}
          height={canvas.background.height}
          style={{ background: 'var(--white)' }}
          ref={stageRef}
        >
          <Layer id="background-layer">
            <Rect {...{ ...canvas.background, fillPatternImage: backgroundImage }} />
          </Layer>
          <Layer id="layers-layer"></Layer>
          <Layer id="actions-layer" ref={actionsLayerRef}></Layer>
        </Stage>
      </div>
      {/* LEFT SHEET RIGHT SHEET TODO */}
    </div>
  );
};
