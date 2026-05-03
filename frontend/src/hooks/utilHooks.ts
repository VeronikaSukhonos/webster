import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import { selectAuthUser } from '@store/authSlice';
import type { AppDispatch, RootState } from '@store/store';

import type { Feedback } from '@mytypes/utilTypes';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

export const useAuth = () => useAppSelector(selectAuthUser.user);

export const useFeedback = () => {
  const initialFeedback: Feedback = { message: '', status: '' };
  const [feedback, setInnerFeedback] = useState<Feedback>(initialFeedback);

  const setFeedback = (message?: string, status?: 'ok' | 'fail') => {
    setInnerFeedback(message && status ? { message, status } : initialFeedback);
  };

  return [feedback, setFeedback] as [Feedback, typeof setFeedback];
};

export const usePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const getPage = () => Math.max(parseInt(searchParams.get('page') || '1') || 1, 1);

  return {
    searchParams,
    setSearchParams,
    getPage,
  };
};

export const useTotal = () => {
  const initialTotal = { totalItems: 0, totalPages: 0 };
  const [total, setInnerTotal] = useState<typeof initialTotal>(initialTotal);

  const setTotal = (total?: number, limit?: number) => {
    setInnerTotal(
      total && limit ? { totalItems: total, totalPages: Math.ceil(total / limit) } : initialTotal,
    );
  };

  return {
    total,
    setTotal,
  };
};
