import { useRef } from 'react';
import { Group, Image, Layer, Rect, Stage } from 'react-konva';
import { useImage } from 'react-konva-utils';

import clsx from 'clsx';
import type Konva from 'konva';

import { selectEditor, setCanvasSize, setLeftSheet } from '@store/editorSlice';

import { NumberField, SizeField } from '@components/InputFields';
import { MainButton } from '@components/MainButton';
import { Popover } from '@components/Menu';
import { Toolbar } from '@components/editor/Toolbar';

import { LayerIcon, QuestionIcon } from '@assets/index';

import { useStageSize, useStageZoom } from '@hooks/editor/useStageZoom';
import { useImages } from '@hooks/useImages';
import { useAppDispatch, useAppSelector } from '@hooks/utilHooks';

import { MAX_CANVAS_SIZE, MAX_SCALE, MIN_CANVAS_SIZE, MIN_SCALE } from '@utils/constants';
import { shortcuts } from '@utils/shortcuts';

import { type CanvasProps, LeftSheets, Modes, Tools } from '@mytypes/editorTypes';

import './Editor.css';

export const Editor = ({ stageRef, backgroundRef }: CanvasProps) => {
  const dispatch = useAppDispatch();

  const canvas = useAppSelector(selectEditor.canvas);
  const tool = useAppSelector(selectEditor.tool);
  const leftSheet = useAppSelector(selectEditor.leftSheet);
  const mode = useAppSelector(selectEditor.mode);
  const project = useAppSelector(selectEditor.project);

  const { stageSize } = useStageSize();
  const { stageZoom, setStageZoom, ...zoomProps } = useStageZoom(stageRef);

  const imagesCtx = useImages();
  const [backgroundImage] = useImage(
    imagesCtx?.findImageItem(canvas.background.image ?? '')?.url ?? '',
    'anonymous',
  );

  const actionsLayerRef = useRef<Konva.Layer | null>(null);

  return (
    <div className="work-area">
      <Toolbar />
      <Stage
        {...stageSize}
        {...zoomProps}
        style={{ background: 'var(--dark-gray)' }}
        draggable={tool === Tools.Grab}
        ref={stageRef}
      >
        <Layer id="background-layer">
          <Group
            x={(stageSize.width - canvas.background.width) / 2}
            y={(stageSize.height - canvas.background.height) / 2}
          >
            <Rect
              name="excluded"
              width={canvas.background.width}
              height={canvas.background.height}
              fill="white"
              stroke="white"
              shadowOffsetY={4}
              shadowBlur={30}
              shadowOpacity={0.15}
              shadowColor="#341734"
            />
            <Rect {...canvas.background} ref={backgroundRef} />
            {canvas.background.image && (
              <Image
                width={canvas.background.width}
                height={canvas.background.height}
                image={backgroundImage}
              />
            )}
          </Group>
        </Layer>
        <Layer id="layers-layer"></Layer>
        <Layer id="actions-layer" ref={actionsLayerRef}>
          {/* <Rect {...selectedArea} fill="aqua" stroke="blue" strokeWidth={1} opacity={0.2} /> */}
        </Layer>
      </Stage>

      <div className="bottom-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MainButton
            noStyle
            className="tool-container mini square"
            tooltipId={LeftSheets.Layers}
            onClick={() => dispatch(setLeftSheet(LeftSheets.Layers))}
          >
            <LayerIcon
              className={clsx('own-color', leftSheet?.type === LeftSheets.Layers && 'active')}
            />
          </MainButton>
          <div className="tool-container mini" style={{ maxWidth: '125px' }}>
            <NumberField
              name="stage-scale"
              value={stageZoom}
              onChange={(e) => setStageZoom({ newScale: e.target.value as number })}
              min={MIN_SCALE}
              max={MAX_SCALE}
              step={0.1}
              align="center"
              buttons
              format="percent"
              noStyle
              mini
            />
          </div>
        </div>
        {mode !== Modes.View && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="tool-container mini" style={{ maxWidth: '215px' }}>
              <SizeField
                name="canvas-size"
                value={{ width: canvas.background.width, height: canvas.background.height }}
                onChange={(e) => dispatch(setCanvasSize(e.target.value))}
                disabled={!!(project && project.template)}
                min={MIN_CANVAS_SIZE}
                max={MAX_CANVAS_SIZE}
                align="center"
                noStyle
                mini
              />
            </div>
            <Popover
              button={
                <MainButton noStyle className="tool-container mini square" tooltipId="help">
                  <QuestionIcon />
                </MainButton>
              }
              className="col mini-gap"
            >
              <h3 className="content-title mini t-art t-center">Shortcuts</h3>
              <hr />
              <div>
                {shortcuts.map((s, i) => (
                  <div key={i} className="row mini-gap">
                    <div
                      style={{
                        color: 'var(--accent-font-color)',
                        fontWeight: 'bold',
                        width: '50px',
                      }}
                    >
                      {s.sc}
                    </div>
                    –<div>{s.explanation}</div>
                  </div>
                ))}
              </div>
            </Popover>
          </div>
        )}
      </div>
    </div>
  );
};
