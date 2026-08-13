import { useState, useEffect, useRef } from "react";

export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const firstRender = useRef(true);

  useEffect(() => {
    // Skip delay on first render to show initial data immediately
    if (firstRender.current) {
      firstRender.current = false;
      setDebouncedValue(value);
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}