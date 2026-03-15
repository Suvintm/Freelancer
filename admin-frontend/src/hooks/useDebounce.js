// ─── Custom Hooks ─────────────────────────────────────────────────────────

// useDebounce — delays state updates until user stops typing
import { useState, useEffect } from "react";

export const useDebounce = (value, delay = 400) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};
