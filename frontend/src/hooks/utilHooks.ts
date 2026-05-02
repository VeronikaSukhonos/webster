import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

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
