import { useContext } from 'react';

import { ImagesContext } from '@contexts/ImagesContext';

export const useImages = () => {
  const ctx = useContext(ImagesContext);

  if (!ctx) throw new Error('useImages must be used inside ImagesContextProvider');
  return ctx;
};
