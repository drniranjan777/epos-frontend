/** Extracts a user-facing message from an Axios error or API error body. */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;
  if (error.code === 'ERR_NETWORK') return 'Cannot reach the server. Check your connection.';
  const apiError = error.response?.data?.error;
  if (apiError?.message) return apiError.message;
  return error.message && !error.response ? error.message : fallback;
}

export function getErrorCode(error) {
  return error?.response?.data?.error?.code;
}

/**
 * Copies field-level validation errors from the API onto a react-hook-form instance.
 * Returns true when at least one field error was applied.
 */
export function applyFieldErrors(error, setError) {
  const details = error?.response?.data?.error?.details;
  if (!Array.isArray(details)) return false;
  let applied = false;
  for (const detail of details) {
    if (detail.field) {
      setError(detail.field, { type: 'server', message: detail.message });
      applied = true;
    }
  }
  return applied;
}
