import { useRef } from 'react';
import { Layer, Rect, Stage } from 'react-konva';
import { Portal, useImage } from 'react-konva-utils';

import type Konva from 'konva';

import { selectEditor } from '@store/editorSlice';

import { Toolbar } from '@components/editor/Toolbar';

import { useImages } from '@hooks/useImages';
import { useAppSelector } from '@hooks/utilHooks';

import './Editor.css';

export const Editor = () => {
  const canvas = useAppSelector(selectEditor.canvas);

  const imagesCtx = useImages();
  const [backgroundImage] = useImage(
    imagesCtx.findImageItem(canvas.background.fillPatternImage ?? '')?.url ?? '',
  );

  const stageRef = useRef<Konva.Stage | null>(null);
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
