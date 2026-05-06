import {
  Menu as RACMenu,
  MenuItem as RACMenuItem,
  type MenuItemProps as RACMenuItemProps,
  type MenuProps as RACMenuProps,
  MenuTrigger as RACMenuTrigger,
} from 'react-aria-components/Menu';
import { type Placement, Popover as RACPopover } from 'react-aria-components/Popover';

import type { MainButton } from '@components/MainButton';

import './Menu.css';

interface MenuItemProps extends Omit<RACMenuItemProps, 'children' | 'className'> {
  children: React.ReactNode;
  className?: string;
}

export const MenuItem = ({ children, className, ...props }: MenuItemProps) => {
  return (
    <RACMenuItem className={'menu-item' + (className ? ` ${className}` : '')} {...props}>
      {children}
    </RACMenuItem>
  );
};

export const Menu = <T extends object>({ ...props }: RACMenuProps<T>) => {
  return <RACMenu className="menu" autoFocus {...props} />;
};

interface DropdownMenuProps<T extends object> extends RACMenuProps<T> {
  button: React.ReactElement<typeof MainButton>;
  placement?: Placement;
}

export const DropdownMenu = <T extends object>({
  button,
  placement = 'bottom',
  ...props
}: DropdownMenuProps<T>) => {
  return (
    <RACMenuTrigger>
      {button}
      <RACPopover className="popover" placement={placement}>
        <Menu {...props} />
      </RACPopover>
    </RACMenuTrigger>
  );
};
