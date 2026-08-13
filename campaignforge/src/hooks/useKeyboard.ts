import { useEffect } from 'react';

export function useKeyboard(key: string, onTrigger: () => void, deps: unknown[] = []) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === key) {
        e.preventDefault();
        onTrigger();
      } else if (e.key === 'Escape' && key === 'Escape') {
        onTrigger();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, onTrigger, ...deps]);
}
