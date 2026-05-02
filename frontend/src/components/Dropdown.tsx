import { useRef } from 'react';

import { useClickOutside } from '@hooks/useClickOutside';

import './Dropdown.css';

interface DropdownProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  button: React.ReactElement;
  items: React.ReactElement[];
  closeOnClick?: boolean;
  toRight?: boolean;
  zTop?: boolean;
}

export const Dropdown = ({
  isOpen,
  setIsOpen,
  button,
  items,
  closeOnClick = true,
  toRight = false,
  zTop = true,
}: DropdownProps) => {
  const containerRef = useRef(null);

  useClickOutside([containerRef], () => {
    if (isOpen) setIsOpen(false);
  });

  return (
    <div
      className="dropdown-container"
      ref={containerRef}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className="dropdown-button">{button}</div>
      <ul
        className={
          (isOpen ? 'open' : 'close') + (toRight ? ' to-right' : '') + (zTop ? ' z-top' : '')
        }
      >
        {items.map((item, i) => {
          return (
            <li
              key={i}
              onClick={() => {
                if (closeOnClick) setIsOpen(false);
              }}
            >
              {item}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

// TODO
