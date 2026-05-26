import { useEffect, useMemo, useState } from 'react';

import clsx from 'clsx';

import { selectEditor, setLeftSheet, setTool, updateLastUsedStyle } from '@store/editorSlice';

import { NumberField, SelectField, SelectLabel } from '@components/InputFields';
import { MainButton } from '@components/MainButton';
import { ImagesPanel, ShapesPanel } from '@components/editor/LeftPanels';
import { Sheet } from '@components/editor/Sheet';

import {
  BrushIcon,
  EraserIcon,
  GrabIcon,
  ImageIcon,
  MarkerIcon,
  PencilIcon,
  SelectIcon,
  ShapeIcon,
  TextIcon,
  UploadIcon,
} from '@assets/index';

import { useAppDispatch, useAppSelector } from '@hooks/utilHooks';

import { capitalize } from '@utils/utils';

import { BrushTypes, LeftSheets, Modes, Tools } from '@mytypes/editorTypes';

interface ToolbarProps {
  onUploadImage?: () => void;
}

export const Toolbar = ({ onUploadImage }: ToolbarProps) => {
  const dispatch = useAppDispatch();

  const tool = useAppSelector(selectEditor.tool);
  const leftSheet = useAppSelector(selectEditor.leftSheet);
  const mode = useAppSelector(selectEditor.mode);
  const lastUsedStyle = useAppSelector(selectEditor.lastUsedStyle);

  const [lastDrawingTool, setLastDrawingTool] = useState(BrushTypes.Pencil);
  const isDrawingTool = Object.values(BrushTypes).some((brushTool) => brushTool === tool);
  const drawingTools = useMemo(
    () => ({
      [BrushTypes.Pencil]: (
        <PencilIcon className={clsx('own-color', tool === Tools.Pencil && 'active')} />
      ),
      [BrushTypes.Marker]: (
        <MarkerIcon className={clsx('own-color', tool === Tools.Marker && 'active')} />
      ),
      [BrushTypes.Brush]: (
        <BrushIcon className={clsx('own-color', tool === Tools.Brush && 'active')} />
      ),
    }),
    [tool],
  );
  const limited = mode === Modes.HalfEdit || mode === Modes.View;

  useEffect(() => {
    if (limited && tool !== Tools.Grab) dispatch(setTool(Tools.Grab));
  }, [mode]);

  return (
    <>
      <div className="main-toolbar tool-container">
        {!limited && (
          <MainButton
            color="transparent"
            tooltipId={Tools.Select}
            onClick={() => dispatch(setTool(Tools.Select))}
          >
            <SelectIcon className={clsx('own-color', tool === Tools.Select && 'active')} />
          </MainButton>
        )}
        <MainButton
          color="transparent"
          tooltipId={Tools.Grab}
          onClick={() => {
            if (!limited) dispatch(setTool(Tools.Grab));
          }}
        >
          <GrabIcon className={clsx('own-color', tool === Tools.Grab && 'active')} />
        </MainButton>

        {!limited && (
          <>
            <MainButton
              color="transparent"
              tooltipId={Tools.Text}
              onClick={() => dispatch(setTool(Tools.Text))}
            >
              <TextIcon className={clsx('own-color', tool === Tools.Text && 'active')} />
            </MainButton>
            <MainButton
              color="transparent"
              tooltipId={lastDrawingTool}
              onClick={() => dispatch(setTool(lastDrawingTool))}
            >
              {drawingTools[lastDrawingTool]}
            </MainButton>
            <SelectField
              name="drawing-tool"
              value={lastDrawingTool}
              onChange={(e) => {
                setLastDrawingTool(e.target.value);
                dispatch(setTool(e.target.value));
              }}
              options={[
                {
                  value: BrushTypes.Pencil,
                  label: (
                    <SelectLabel>
                      <PencilIcon />
                      {capitalize(BrushTypes.Pencil)}
                    </SelectLabel>
                  ),
                },
                {
                  value: BrushTypes.Marker,
                  label: (
                    <SelectLabel>
                      <MarkerIcon />
                      {capitalize(BrushTypes.Marker)}
                    </SelectLabel>
                  ),
                },
                {
                  value: BrushTypes.Brush,
                  label: (
                    <SelectLabel>
                      <BrushIcon />
                      {capitalize(BrushTypes.Brush)}
                    </SelectLabel>
                  ),
                },
              ]}
              onlyChevron
            />
            <MainButton
              color="transparent"
              tooltipId={Tools.Eraser}
              onClick={() => dispatch(setTool(Tools.Eraser))}
            >
              <EraserIcon className={clsx('own-color', tool === Tools.Eraser && 'active')} />
            </MainButton>
            <div className="ver-hr"></div>
            <Sheet
              title={LeftSheets.Shapes}
              isOpen={leftSheet?.type === LeftSheets.Shapes}
              setIsOpen={() => dispatch(setLeftSheet(LeftSheets.Shapes))}
              buttonProps={{
                color: 'transparent' as const,
                tooltipId: LeftSheets.Shapes,
                children: (
                  <ShapeIcon
                    className={clsx('own-color', leftSheet?.type === LeftSheets.Shapes && 'active')}
                  />
                ),
              }}
            >
              <ShapesPanel />
            </Sheet>
            <Sheet
              title={LeftSheets.Images}
              isOpen={leftSheet?.type === LeftSheets.Images}
              setIsOpen={() => dispatch(setLeftSheet(LeftSheets.Images))}
              buttonProps={{
                color: 'transparent' as const,
                tooltipId: LeftSheets.Images,
                children: (
                  <ImageIcon
                    className={clsx('own-color', leftSheet?.type === LeftSheets.Images && 'active')}
                  />
                ),
              }}
            >
              <ImagesPanel />
            </Sheet>

            <MainButton color="transparent" tooltipId="upload" onClick={onUploadImage}>
              <UploadIcon className={clsx('own-color')} />
            </MainButton>
          </>
        )}
      </div>
      {!limited && isDrawingTool && (
        <div className="drawing-settings tool-container">
          {tool !== Tools.Eraser && (
            <input
              className="color-input"
              type="color"
              value={lastUsedStyle.stroke}
              aria-label="Brush color"
              onChange={(e) => dispatch(updateLastUsedStyle({ stroke: e.target.value }))}
            />
          )}
          <NumberField
            name="brush-width"
            value={lastUsedStyle.strokeWidth}
            min={1}
            max={50}
            step={1}
            onChange={(e) => dispatch(updateLastUsedStyle({ strokeWidth: e.target.value ?? 1 }))}
            noStyle
            mini
            buttons
            align="center"
          />
        </div>
      )}
    </>
  );
};
