import { differenceInDays, format, formatDistanceToNow } from 'date-fns';

export const formatDate = (date: string, withTime: boolean = false) => {
  const d = new Date(date);

  if (!date) return '';
  if (withTime) return format(d, 'd MMM yyyy HH:mm');
  return differenceInDays(new Date(), d) < 7
    ? formatDistanceToNow(d, { addSuffix: true })
    : format(d, 'd MMM yyyy');
};
