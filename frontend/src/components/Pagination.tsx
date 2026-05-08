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
      onClick={() => onClick(page)}
      disabled={disabled || page === current}
      color={page === current ? 'purple' : 'white'}
      square
      mini
      style={{ paddingTop: '4px' }}
    >
      {page.toString()}
    </MainButton>
  );
};

const DotsButton = () => {
  return (
    <MainButton disabled color="white" square mini>
      <DotsIcon style={{ transform: 'rotate(-90deg)' }} />
    </MainButton>
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
        onClick={() => selectPage(page - 1)}
        disabled={page <= 1 || disabled}
        color="white"
        square
        mini
        className="pagination-nav-button"
      >
        <ChevronIcon style={{ padding: '2px' }} />
      </MainButton>
      {pageOptions}
      <MainButton
        onClick={() => selectPage(page + 1)}
        disabled={page >= tp || disabled}
        color="white"
        square
        mini
        className="pagination-nav-button"
      >
        <ChevronIcon style={{ transform: 'rotate(180deg)', padding: '2px' }} />
      </MainButton>
    </div>
  );
};
