import { useCallback, useState } from 'react';

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * useState that remembers its value on this device (layout preferences such as the
 * collapsed sidebar). Falls back to plain state when storage is unavailable.
 * `initial` may be a function, evaluated only when nothing is stored.
 */
export function useStoredState(key, initial) {
  const [value, setValue] = useState(() =>
    read(key, typeof initial === 'function' ? initial() : initial),
  );
  const set = useCallback(
    (next) => {
      setValue((current) => {
        const resolved = typeof next === 'function' ? next(current) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // Private mode or blocked storage: the preference just lasts for this visit.
        }
        return resolved;
      });
    },
    [key],
  );
  return [value, set];
}
