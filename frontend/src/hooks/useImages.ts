import { useContext } from 'react';

import { ImagesContext } from '@contexts/ImagesContext';

export const useImages = () => {
  const ctx = useContext(ImagesContext);

  if (!ctx) console.log('ImagesContext is temporarily unavailable');
  return ctx;
};
