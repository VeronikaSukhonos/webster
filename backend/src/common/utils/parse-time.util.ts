export function parseTime(t: `${string}${'d' | 'm'}`) {
  const time = parseInt(t),
    unit = t.at(-1) ?? ' ';

  if (!time || !['m', 'd'].includes(unit))
    throw new Error('Invalid time - must be in 1m or 1d format');
  return unit === 'm' ? time * 60 * 1000 : time * 24 * 60 * 60 * 1000;
}
