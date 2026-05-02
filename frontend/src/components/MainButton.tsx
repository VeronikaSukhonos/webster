import { Link } from 'react-router-dom';
import { Tooltip } from 'react-tooltip';

import './MainButton.css';

interface MainButtonProps {
  content: string | React.ReactElement;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  to?: string;
  tooltip?: string;
  tooltipId?: string;
  tooltipPlace?: 'top' | 'bottom';
  color?: 'purple' | 'white' | 'transparent';
  upperText?: boolean;
  wide?: boolean;
  square?: boolean;
  mini?: boolean;
  classes?: string;
  style?: React.CSSProperties;
}

export const MainButton = ({
  content,
  onClick,
  type = 'button',
  disabled = false,
  to = '',
  tooltip = '',
  tooltipId = '',
  tooltipPlace = 'top',
  color = 'purple',
  upperText = false,
  wide = false,
  square = false,
  mini = false,
  classes = '',
  style = {},
}: MainButtonProps) => {
  const className =
    `main-button ${color}` +
    (classes ? ` ${classes}` : '') +
    (upperText ? ' upper-text' : '') +
    (wide ? ' wide' : '') +
    (square ? ' square' : '') +
    (mini ? ' mini' : '');

  if (to)
    return (
      <Link to={to} className={className} style={style}>
        {content}
      </Link>
    );

  return (
    <>
      <button
        className={className + ' ' + tooltipId}
        type={type}
        onClick={onClick}
        disabled={disabled}
        style={style}
      >
        {content}
      </button>
      {tooltip && tooltipId && (
        <Tooltip className="btn-tooltip" anchorSelect={`.${tooltipId}`} place={tooltipPlace}>
          {tooltip}
        </Tooltip>
      )}
    </>
  );
};
