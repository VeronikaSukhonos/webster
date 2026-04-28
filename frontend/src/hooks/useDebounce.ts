import { useEffect, useState } from 'react';

export const useDebounce = (value: string, time: number = 300) => {
  const [dbValue, setDbValue] = useState(value);

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
