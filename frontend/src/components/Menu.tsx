import React from 'react';
import {
  Menu as RACMenu,
  MenuItem as RACMenuItem,
  type MenuItemProps as RACMenuItemProps,
  type MenuProps as RACMenuProps,
  MenuTrigger as RACMenuTrigger,
} from 'react-aria-components/Menu';
import {
  type Placement,
  DialogTrigger as RACDialogTrigger,
  Popover as RACPopover,
  type PopoverProps as RACPopoverProps,
} from 'react-aria-components/Popover';

import clsx from 'clsx';

import type { MainButton } from '@components/MainButton';

import './Menu.css';

interface MenuItemProps extends Omit<RACMenuItemProps, 'children' | 'className'> {
  children: React.ReactNode;
  className?: string;
}

export const MenuItem = ({ children, className, ...props }: MenuItemProps) => {
  return (
    <RACMenuItem className={clsx('menu-item', className)} {...props}>
      {children}
    </RACMenuItem>
  );
};

export const Menu = <T extends object>({ ...props }: RACMenuProps<T>) => {
  return <RACMenu className="menu scroll" autoFocus {...props} />;
};

interface DropdownMenuProps<T extends object> extends Omit<RACMenuProps<T>, 'children'> {
  button: React.ReactElement<typeof MainButton>;
  placement?: Placement;
  children: React.ReactNode;
  noItems?: string;
  onOpenChange?: (open: boolean) => void;
}

export const DropdownMenu = <T extends object>({
  button,
  placement = 'bottom',
  children,
  noItems = 'No items',
  onOpenChange,
  ...props
}: DropdownMenuProps<T>) => {
  const hasChildren = React.Children.count(children) > 0;

  return (
    <RACMenuTrigger onOpenChange={onOpenChange}>
      {button}

      <RACPopover className="popover" placement={placement}>
        <Menu {...props}>{hasChildren ? children : <MenuItem isDisabled>{noItems}</MenuItem>}</Menu>
      </RACPopover>
    </RACMenuTrigger>
  );
};

interface PopoverProps extends Omit<RACPopoverProps, 'children' | 'className'> {
  button: React.ReactElement<typeof MainButton>;
  children: React.ReactNode;
  className?: string;
}

export const Popover = ({ button, children, className, ...props }: PopoverProps) => {
  return (
    <RACDialogTrigger>
      {button}
      <RACPopover className="popover" {...props}>
        <div className={className} style={{ maxWidth: '314px' }}>
          {children}
        </div>
      </RACPopover>
    </RACDialogTrigger>
  );
};
