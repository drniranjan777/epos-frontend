import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

/**
 * Keeps list filters in the URL so they survive reloads and the back button.
 * Empty values are removed; changing any filter except `page` resets to page 1.
 */
export function useUrlFilters(defaults = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const values = { ...defaults };
    for (const [key, value] of searchParams.entries()) values[key] = value;
    return values;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- defaults are static per page
  }, [searchParams]);

  const setFilters = useCallback(
    (changes) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(changes)) {
            if (value === '' || value === null || value === undefined) next.delete(key);
            else next.set(key, String(value));
          }
          if (!('page' in changes)) next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return [filters, setFilters];
}
