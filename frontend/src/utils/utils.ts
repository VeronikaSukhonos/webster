import { differenceInDays, format, formatDistanceToNow } from 'date-fns';

export const formatDate = (date: string, withTime: boolean = false) => {
  const d = new Date(date);

  if (!date) return '';
  if (withTime) return format(d, 'd MMM yyyy HH:mm');
  return differenceInDays(new Date(), d) < 7
    ? formatDistanceToNow(d, { addSuffix: true })
    : format(d, 'd MMM yyyy');
};

export const createQuery = (query?: object) => {
  if (!query) return '';

  let result: string[] = [];

  Object.entries(query).map(([param, value]) => {
    if (
      value !== undefined &&
      value !== '' &&
      value !== false &&
      (value.length > 0 || value.length === undefined)
    )
      result.push(`${param}=${value instanceof Date ? value.toISOString() : value}`);
  });

  return result.length ? '?' + result.join('&') : '';
};

export const capitalize = (text: string) => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};
