import { useMemo, useState } from 'react';

import clsx from 'clsx';

import { selectEditor, setLeftSheet, setTool } from '@store/editorSlice';

import { SelectField, SelectLabel } from '@components/InputFields';
import { MainButton } from '@components/MainButton';

import {
  BrushIcon,
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

export const Toolbar = () => {
  const dispatch = useAppDispatch();

  const tool = useAppSelector(selectEditor.tool);
  const leftSheet = useAppSelector(selectEditor.leftSheet);
  const mode = useAppSelector(selectEditor.mode);

  const [lastDrawingTool, setLastDrawingTool] = useState(BrushTypes.Pencil);
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

  return (
    <div className="main-toolbar tool-container">
      <MainButton
        color="transparent"
        tooltipId={Tools.Select}
        onClick={() => dispatch(setTool(Tools.Select))}
      >
        <SelectIcon className={clsx('own-color', tool === Tools.Select && 'active')} />
      </MainButton>
      <MainButton
        color="transparent"
        tooltipId={Tools.Grab}
        onClick={() => dispatch(setTool(Tools.Grab))}
      >
        <GrabIcon className={clsx('own-color', tool === Tools.Grab && 'active')} />
      </MainButton>

      {mode !== Modes.View && (
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
          <div className="ver-hr"></div>
          <MainButton
            color="transparent"
            tooltipId={LeftSheets.Shapes}
            onClick={() => dispatch(setLeftSheet(LeftSheets.Shapes))}
          >
            <ShapeIcon
              className={clsx('own-color', leftSheet?.type === LeftSheets.Shapes && 'active')}
            />
          </MainButton>
          <MainButton
            color="transparent"
            tooltipId={LeftSheets.Images}
            onClick={() => dispatch(setLeftSheet(LeftSheets.Images))}
          >
            <ImageIcon
              className={clsx('own-color', leftSheet?.type === LeftSheets.Images && 'active')}
            />
          </MainButton>
          <MainButton color="transparent" tooltipId="upload">
            <UploadIcon className={clsx('own-color')} />
          </MainButton>
        </>
      )}
    </div>
  );
};
