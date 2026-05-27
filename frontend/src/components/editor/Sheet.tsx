import { useRef } from 'react';
import {
  Popover as RACPopover,
  type PopoverProps as RACPopoverProps,
} from 'react-aria-components/Popover';
import { useResizeDetector } from 'react-resize-detector';

import clsx from 'clsx';

import { MainButton, type MainButtonProps } from '@components/MainButton';

import { ChevronIcon } from '@assets/index';

import { capitalize } from '@utils/utils';

import './Sheet.css';

interface SheetProps extends Omit<RACPopoverProps, 'children' | 'className'> {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  setIsOpen: () => void;
  buttonProps: MainButtonProps;
  side?: 'left' | 'right';
  shouldCloseOnOutside?: boolean;
}

export const Sheet = ({
  title,
  children,
  isOpen,
  setIsOpen,
  buttonProps,
  side = 'left',
  shouldCloseOnOutside,
  ...props
}: SheetProps) => {
  const { height, ref } = useResizeDetector<HTMLButtonElement>({ handleWidth: false });
  const anchorRef = useRef<HTMLDivElement | null>(null);

  return (
    <>
      <MainButton {...buttonProps} onClick={() => setIsOpen()} />
      <div className={clsx('sheet-anchor', side)} ref={anchorRef}></div>
      <RACPopover
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (open) setIsOpen();
        }}
        className={clsx('sheet col box pd-box', side)}
        shouldCloseOnInteractOutside={() => !!shouldCloseOnOutside}
        isNonModal
        triggerRef={anchorRef}
        ref={ref}
        {...props}
      >
        <div className="col mini-gap">
          <div className="row ver-center" style={{ justifyContent: 'space-between' }}>
            <h2 className="content-title mini">{capitalize(title)}</h2>
            <MainButton onClick={() => setIsOpen()} color="blue" mini square>
              <ChevronIcon />
            </MainButton>
          </div>
          <div
            className="sheet-content scroll"
            style={{
              height: (height ?? 200) - 32,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {children}
          </div>
        </div>
      </RACPopover>
    </>
  );
};
