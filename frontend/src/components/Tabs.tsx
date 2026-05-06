import {
  Tab as RACTab,
  TabList as RACTabList,
  type TabListProps as RACTabListProps,
  TabPanel as RACTabPanel,
  type TabPanelProps as RACTabPanelProps,
  TabPanels as RACTabPanels,
  type TabPanelsProps as RACTabPanelsProps,
  type TabProps as RACTabProps,
  Tabs as RACTabs,
  type TabsProps as RACTabsProps,
} from 'react-aria-components/Tabs';

import './Tabs.css';

export const Tabs = ({ ...props }: RACTabsProps) => <RACTabs className="col" {...props} />;

export const TabList = <T extends object>({ ...props }: RACTabListProps<T>) => {
  return (
    <div>
      <hr />
      <RACTabList className="row" style={{ padding: '7px 0' }} {...props} />
      <hr />
    </div>
  );
};

interface TabProps extends Omit<RACTabProps, 'children'> {
  children: React.ReactNode;
  mini?: boolean;
}

export const Tab = ({ children, mini, ...props }: TabProps) => {
  return (
    <RACTab className={'tab' + (mini ? ' mini' : '')} {...props}>
      {children}
    </RACTab>
  );
};

export const TabPanels = <T extends object>({ ...props }: RACTabPanelsProps<T>) => {
  return <RACTabPanels {...props} />;
};

interface TabPanelProps extends Omit<RACTabPanelProps, 'children'> {
  children: React.ReactNode;
}

export const TabPanel = ({ children, ...props }: TabPanelProps) => {
  return <RACTabPanel {...props}>{children}</RACTabPanel>;
};
