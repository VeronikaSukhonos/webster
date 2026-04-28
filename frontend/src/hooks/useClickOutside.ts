import { useEffect } from 'react';

export const useClickOutside = (refs: React.RefObject<HTMLElement | null>[], cb: () => void) => {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      let outside = true;

      for (const ref of refs)
        if (ref.current && ref.current.contains(e.target as HTMLElement)) outside = false;

      if (outside) cb();
    };

    document.addEventListener('mousedown', handleClick);

    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [refs, cb]);
};
