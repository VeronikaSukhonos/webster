import {
  type PressEvent,
  Button as RACButton,
  type ButtonProps as RACButtonProps,
} from 'react-aria-components/Button';
import { Link } from 'react-router-dom';
import { Tooltip } from 'react-tooltip';

import clsx from 'clsx';

import { capitalize } from '@utils/utils';

import './MainButton.css';

export interface MainButtonProps extends Omit<
  RACButtonProps,
  'children' | 'className' | 'onClick'
> {
  children: React.ReactNode;
  onClick?: (e: PressEvent) => void;
  type?: 'button' | 'submit';
  to?: string;
  tooltip?: string;
  tooltipId?: string;
  tooltipPlace?: 'top' | 'bottom';
  disabled?: boolean;
  noStyle?: boolean;
  color?: 'purple' | 'white' | 'blue' | 'transparent';
  upperText?: boolean;
  wide?: boolean;
  square?: boolean;
  mini?: boolean;
  className?: string;
  style?: React.CSSProperties;
  ref?: React.Ref<HTMLButtonElement>;
}

export const MainButton = ({
  children,
  onClick,
  type = 'button',
  to = '',
  tooltip = '',
  tooltipId = '',
  tooltipPlace = 'top',
  disabled = false,
  noStyle = false,
  color = 'purple',
  upperText = false,
  wide = false,
  square = false,
  mini = false,
  className = '',
  style = {},
  ...props
}: MainButtonProps) => {
  const classes = clsx(
    noStyle ? 'no-style-button' : 'main-button no-wrap',
    color,
    className,
    upperText && 'upper-text',
    wide && 'wide',
    square && 'square',
    mini && 'mini',
  );
  const button = to ? (
    <Link
      to={to}
      className={classes + (disabled ? ' disabled' : '') + (tooltipId ? ` ${tooltipId}` : '')}
      style={style}
    >
      {children}
    </Link>
  ) : (
    <RACButton
      className={classes + (tooltipId ? ` ${tooltipId}` : '')}
      type={type}
      onPress={onClick}
      isDisabled={disabled}
      style={style}
      {...props}
    >
      {children}
    </RACButton>
  );

  return (
    <>
      {button}
      {tooltipId && (
        <Tooltip
          className="btn-tooltip"
          anchorSelect={`.${tooltipId}`}
          place={tooltipPlace}
          delayShow={1000}
          delayHide={100}
        >
          {tooltip || capitalize(tooltipId)}
        </Tooltip>
      )}
    </>
  );
};
