import { useEffect, useState } from 'react';

export const useDebounce = <T>(value: T, time: number = 300) => {
  const [dbValue, setDbValue] = useState<T>(value);

  useEffect(() => {
    const wait = setTimeout(() => {
      setDbValue(value);
    }, time);

    return () => {
      clearTimeout(wait);
    };
  }, [value, time]);

  return dbValue;
};
