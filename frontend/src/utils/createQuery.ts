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
