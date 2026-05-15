import clsx from 'clsx';

import { ConfirmIcon, Error } from '@assets/index';

import type { Feedback as FeedbackType } from '@mytypes/utilTypes';

interface FeedbackProps {
  feedback: FeedbackType;
  showIcon?: boolean;
}

export const Feedback = ({ feedback: { message, status }, showIcon = false }: FeedbackProps) => {
  if (!message || !status) return;

  return (
    <>
      <p className={clsx('feedback', status)}>{message}</p>
      {showIcon &&
        (status === 'ok' ? (
          <ConfirmIcon className="result-icon" />
        ) : (
          <Error className="result-icon" />
        ))}
    </>
  );
};
