/** User-facing message when network/connection fails. */
export const CONNECTION_FAILED_MSG = 'Connection failed. Check your internet and try again.';

/**
 * True if the error is a network/connection failure (e.g. offline, unreachable host).
 */
export function isNetworkError(err: unknown): boolean {
  const msg = err != null && typeof err === 'object' && 'message' in err
    ? String((err as { message: unknown }).message)
    : err instanceof Error
      ? err.message
      : '';
  const lower = msg.toLowerCase();
  return lower.includes('network request failed') || lower.includes('fetch failed');
}

/**
 * Normalize Supabase/network/unknown errors to a human-readable string for UI.
 * Use for list and mutation error display so messages are consistent and safe.
 */
export function toHumanMessage(err: unknown): string {
  if (err == null)
    return 'Something went wrong.';
  if (isNetworkError(err))
    return CONNECTION_FAILED_MSG;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const msg = (err as { message: unknown }).message;
    if (typeof msg === 'string' && msg.length > 0)
      return msg;
  }
  if (err instanceof Error)
    return err.message || 'Something went wrong.';
  return 'Something went wrong.';
}
