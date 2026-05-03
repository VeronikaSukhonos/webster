import { useEffect, useMemo, useState } from 'react';

import { MainButton } from '@components/MainButton';

import { ChevronIcon, DotsIcon } from '@assets/index';

import { usePage } from '@hooks/utilHooks';

interface PageButtonProps {
  page: number;
  current: number;
  onClick: (page: number) => void;
  disabled?: boolean;
}

const PageButton = ({ page, current, onClick, disabled = false }: PageButtonProps) => {
  return (
    <MainButton
      content={page.toString()}
      onClick={() => onClick(page)}
      disabled={disabled || page === current}
      color={page === current ? 'purple' : 'white'}
      square
      mini
      style={{ paddingTop: '4px' }}
    />
  );
};

const DotsButton = () => {
  return (
    <MainButton
      content={<DotsIcon style={{ transform: 'rotate(-90deg)' }} />}
      disabled
      color="white"
      square
      mini
    />
  );
};

interface PaginationProps {
  totalPages: number;
  disabled?: boolean;
}

export const Pagination = ({ totalPages: tp, disabled = false }: PaginationProps) => {
  const { searchParams, setSearchParams, getPage } = usePage();

  const [page, setPage] = useState(getPage());

  useEffect(() => {
    setPage(getPage());
  }, [searchParams]);

  const selectPage = (p: number) => {
    setSearchParams((searchParams) => {
      searchParams.set('page', p.toString());
      return searchParams;
    });
  };

  const pageOptions: React.ReactNode = useMemo(() => {
    const pages = [];

    if (tp <= 7) {
      for (let i = 0; i < tp; i++) pages.push(i + 1);

      return (
        <div className="row all-center mini-gap">
          {pages.map((p, i) => (
            <PageButton key={i} page={p} current={page} onClick={selectPage} disabled={disabled} />
          ))}
        </div>
      );
    } else {
      if (page < 5) pages.push(1, 2, 3, 4, 5, '.', tp);
      else if (page > tp - 4) pages.push(1, '.', tp - 4, tp - 3, tp - 2, tp - 1, tp);
      else pages.push(1, '.', page - 1, page, page + 1, '.', tp);

      return (
        <div className="row all-center mini-gap">
          {pages.map((p, i) =>
            p === '.' ? (
              <DotsButton key={i} />
            ) : (
              <PageButton
                key={i}
                page={p as number}
                current={page}
                onClick={selectPage}
                disabled={disabled}
              />
            ),
          )}
        </div>
      );
    }
  }, [page, tp]);

  if (!tp) return;

  return (
    <div className="row all-center mini-gap" style={{ maxWidth: 'max-content' }}>
      <MainButton
        content={<ChevronIcon style={{ padding: '2px' }} />}
        onClick={() => selectPage(page - 1)}
        disabled={page <= 1 || disabled}
        color="white"
        square
        mini
        classes="pagination-nav-button"
      />
      {pageOptions}
      <MainButton
        content={<ChevronIcon style={{ transform: 'rotate(180deg)', padding: '2px' }} />}
        onClick={() => selectPage(page + 1)}
        disabled={page >= tp || disabled}
        color="white"
        square
        mini
        classes="pagination-nav-button"
      />
    </div>
  );
};
