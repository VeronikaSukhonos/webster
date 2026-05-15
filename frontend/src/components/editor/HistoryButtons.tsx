import { MainButton } from '@components/MainButton';

import { ArrowIcon, HistoryIcon } from '@assets/index';

export const buttonProps = {
  color: 'transparent' as const,
  square: true,
  mini: true,
  style: { borderRadius: '50%' },
};

export const HistoryButtons = () => {
  const openHistory = () => {};

  const undo = () => {};

  const redo = () => {};

  return (
    <>
      <MainButton onClick={openHistory} {...buttonProps} aria-label="History">
        <HistoryIcon />
      </MainButton>
      <div className="row mini-gap" style={{ width: 'max-content' }}>
        <MainButton onClick={undo} {...buttonProps} aria-label="Undo">
          <ArrowIcon />
        </MainButton>
        <MainButton onClick={redo} {...buttonProps} aria-label="Redo">
          <ArrowIcon style={{ transform: 'rotate(180deg)' }} />
        </MainButton>
      </div>
    </>
  );
};
