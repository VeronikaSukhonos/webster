import { useState } from 'react';

import { ChevronIcon } from '@assets/index';

import './Accordion.css';

interface AccordionItemProps {
  title: React.ReactElement;
  content: React.ReactElement;
  isItemOpen: boolean;
  onClick: React.MouseEventHandler<HTMLElement>;
}

const AccordionItem = ({ title, content, isItemOpen = false, onClick }: AccordionItemProps) => {
  return (
    <div className={`accordion-item ${isItemOpen ? 'open' : 'close'}`}>
      <div
        className="accordion-title row ver-center"
        style={{ gap: '15px', cursor: 'pointer' }}
        onClick={onClick}
      >
        <ChevronIcon className="accordion-icon" />
        {title}
      </div>
      <div className="accordion-content">{content}</div>
    </div>
  );
};

interface AccordionProps {
  items: { title: React.ReactElement; content: React.ReactElement }[];
  defaultOpenItems?: number[];
}

const Accordion = ({ items, defaultOpenItems = [] }: AccordionProps) => {
  const [openItems, setOpenItems] = useState(defaultOpenItems);

  const openOrClose = (item: number) => {
    setOpenItems((oi) => (oi.includes(item) ? oi.filter((i) => i !== item) : [...oi, item]));
  };

  return (
    <div className="accordion">
      {items.map((item, i) => {
        return (
          <AccordionItem
            key={i}
            title={item.title}
            content={item.content}
            isItemOpen={openItems.includes(i)}
            onClick={() => openOrClose(i)}
          />
        );
      })}
    </div>
  );
};

export default Accordion;
