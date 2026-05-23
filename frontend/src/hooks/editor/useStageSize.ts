import { useEffect, useState } from 'react';

import { useDebounce } from '@hooks/useDebounce';

import type { Size } from '@mytypes/editorTypes';

export const useStageSize = () => {
  const [innerStageSize, setStageSize] = useState<Size>({
    width: window.visualViewport?.width ?? window.innerWidth,
    height: window.visualViewport?.height ?? window.innerHeight,
  });
  const stageSize = useDebounce(innerStageSize, 500);

  useEffect(() => {
    const updateSize = () => {
      setStageSize({
        width: window.visualViewport?.width ?? window.innerWidth,
        height: window.visualViewport?.height ?? window.innerHeight,
      });
    };

    window.addEventListener('resize', updateSize);

    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  return { stageSize };
};
