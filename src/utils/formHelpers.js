import { z } from 'zod';

/** Number input that treats an empty field as `fallback` (default 0). */
export const numberField = (fallback = 0) =>
  z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? fallback : Number(v)),
    z.number({ invalid_type_error: 'Enter a number' }).min(0, 'Cannot be negative'),
  );

/** Optional select holding an id: '' becomes null. */
export const optionalIdField = z.preprocess(
  (v) => (v === '' || v == null ? null : Number(v)),
  z.number().nullable(),
);

export const requiredIdField = (message) =>
  z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number({ required_error: message }),
  );

/** Converts null/undefined to '' so inputs stay controlled when resetting a form from API data. */
export function toFormValues(data, keys) {
  return Object.fromEntries(keys.map((key) => [key, data?.[key] ?? '']));
}

/** Trims strings and turns '' into null so optional columns are cleared, not set to ''. */
export function emptyToNull(values) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => {
      if (typeof value !== 'string') return [key, value];
      const trimmed = value.trim();
      return [key, trimmed === '' ? null : trimmed];
    }),
  );
}
