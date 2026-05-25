import { selectEditor, setHistoryTarget, setRightSheet } from '@store/editorSlice';

import { MainButton } from '@components/MainButton';
import { HistoryPanel } from '@components/editor/RightPanels';
import { Sheet } from '@components/editor/Sheet';

import { ArrowIcon, HistoryIcon } from '@assets/index';

import { useAppDispatch, useAppSelector } from '@hooks/utilHooks';

import { RightSheets } from '@mytypes/editorTypes';

export const buttonProps = {
  color: 'transparent' as const,
  square: true,
  mini: true,
  style: { borderRadius: '50%' },
};

export const HistoryButtons = () => {
  const dispatch = useAppDispatch();

  const history = useAppSelector(selectEditor.history);
  const historyTarget = useAppSelector(selectEditor.historyTarget);
  const rightSheet = useAppSelector(selectEditor.rightSheet);

  const undo = () => {
    dispatch(setHistoryTarget(historyTarget + 1));
  };

  const redo = () => {
    dispatch(setHistoryTarget(historyTarget - 1));
  };

  return (
    <>
      <Sheet
        title={RightSheets.History}
        isOpen={rightSheet?.type === RightSheets.History}
        setIsOpen={() => dispatch(setRightSheet(RightSheets.History))}
        buttonProps={{
          ...buttonProps,
          tooltipId: RightSheets.History,
          children: <HistoryIcon />,
        }}
        side="right"
      >
        <HistoryPanel />
      </Sheet>
      <div className="row mini-gap" style={{ width: 'max-content' }}>
        <MainButton
          onClick={undo}
          {...buttonProps}
          aria-label="Undo"
          tooltipId="undo"
          disabled={historyTarget === history.length - 1}
        >
          <ArrowIcon />
        </MainButton>
        <MainButton
          onClick={redo}
          {...buttonProps}
          aria-label="Redo"
          tooltipId="redo"
          disabled={historyTarget === 0}
        >
          <ArrowIcon style={{ transform: 'rotate(180deg)' }} />
        </MainButton>
      </div>
    </>
  );
};
