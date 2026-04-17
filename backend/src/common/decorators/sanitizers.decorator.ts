import { Transform } from 'class-transformer';

export function SanitizeString(
  letterCase: 'lower' | 'upper' | 'any' = 'any',
  trim: boolean = true,
) {
  return Transform(({ value }): unknown => {
    if (typeof value === 'string') {
      if (trim) value = value.trim();
      if (letterCase === 'lower') return (value as string).toLowerCase();
      else if (letterCase === 'upper') return (value as string).toUpperCase();
    }
    return value;
  });
}
