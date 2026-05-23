import { Group, Image, Layer, Rect, Stage, Transformer } from 'react-konva';
import { useImage } from 'react-konva-utils';

// import { Html } from 'react-konva-utils';

import clsx from 'clsx';

import { selectEditor, setCanvasSize, setLeftSheet } from '@store/editorSlice';

import { NumberField, SizeField } from '@components/InputFields';
import { MainButton } from '@components/MainButton';
import { Popover } from '@components/Menu';
import { CanvasElementShape } from '@components/editor/CanvasElementShape';
import { LayersPanel } from '@components/editor/LeftPanels';
import { Sheet } from '@components/editor/Sheet';
import { Toolbar } from '@components/editor/Toolbar';

import { LayerIcon, QuestionIcon } from '@assets/index';

import { useStageSize } from '@hooks/editor/useStageSize';
import { useStageZoom, useToolbar } from '@hooks/editor/useToolbar';
import { useImages } from '@hooks/useImages';
import { useAppDispatch, useAppSelector } from '@hooks/utilHooks';

import {
  DEFAULT_BORDER_COLOR,
  MAX_CANVAS_SIZE,
  MAX_SCALE,
  MIN_CANVAS_SIZE,
  MIN_SCALE,
} from '@utils/constants';
import { shortcuts } from '@utils/shortcuts';

import { type CanvasProps, LeftSheets, Modes, Tools } from '@mytypes/editorTypes';

import './Editor.css';

export const Editor = ({ stageRef, backgroundRef }: CanvasProps) => {
  const dispatch = useAppDispatch();

  const canvas = useAppSelector(selectEditor.canvas);
  const selectedIds = useAppSelector(selectEditor.selected);
  const tool = useAppSelector(selectEditor.tool);
  const mode = useAppSelector(selectEditor.mode);
  const leftSheet = useAppSelector(selectEditor.leftSheet);
  const project = useAppSelector(selectEditor.project);

  const { stageSize } = useStageSize();
  const { stageZoom, setStageZoom, ...zoomProps } = useStageZoom(stageRef);
  const { selectRectProps, transformerRef, selectGroupRef, ...toolbarHandlers } =
    useToolbar(stageRef);

  const imagesCtx = useImages();
  const [backgroundImage] = useImage(
    imagesCtx?.findImageItem(canvas.background.image ?? '')?.url ?? '',
    'anonymous',
  );

  return (
    <div className="work-area">
      <Toolbar />
      <Stage
        {...stageSize}
        {...zoomProps}
        {...toolbarHandlers}
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
                listening={false}
              />
            )}
            {selectedIds.includes('background') && (
              <Rect
                x={-3}
                y={-3}
                width={canvas.background.width + 6}
                height={canvas.background.height + 6}
                stroke={DEFAULT_BORDER_COLOR}
                strokeWidth={1}
                listening={false}
              />
            )}
          </Group>
        </Layer>
        <Layer id="elements-layer">
          {canvas.elements
            .filter((el) => !selectedIds.includes(el.id))
            .map((el) => (
              <CanvasElementShape key={el.id} element={el} />
            ))}
        </Layer>
        <Layer id="actions-layer">
          <Group ref={selectGroupRef} draggable={tool === Tools.Select}>
            {canvas.elements
              .filter((el) => selectedIds.includes(el.id))
              .map((el) => (
                <CanvasElementShape key={el.id} element={el} draggable={false} />
              ))}
          </Group>
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(o, n) => (n.width < 1 || n.height < 1 ? o : n)}
            borderStroke={DEFAULT_BORDER_COLOR}
            borderStrokeWidth={1}
            anchorFill="white"
            anchorStroke={DEFAULT_BORDER_COLOR}
            anchorStrokeWidth={2}
            anchorSize={10}
            anchorCornerRadius={20}
          />
          <Rect {...selectRectProps} />
        </Layer>
      </Stage>

      <div className="bottom-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sheet
            title={LeftSheets.Layers}
            isOpen={leftSheet?.type === LeftSheets.Layers}
            setIsOpen={() => dispatch(setLeftSheet(LeftSheets.Layers))}
            buttonProps={{
              noStyle: true,
              className: 'tool-container mini square',
              tooltipId: LeftSheets.Layers,
              children: (
                <LayerIcon
                  className={clsx('own-color', leftSheet?.type === LeftSheets.Layers && 'active')}
                />
              ),
            }}
          >
            <LayersPanel />
          </Sheet>
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
            <div className="tool-container mini" style={{ maxWidth: '215px', marginRight: 42 }}>
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
                <MainButton
                  noStyle
                  className="tool-container mini square"
                  style={{ position: 'fixed', bottom: 10, right: 10 }}
                  tooltipId="help"
                >
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
