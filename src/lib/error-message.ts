/**
 * Normalize Supabase/network/unknown errors to a human-readable string for UI.
 * Use for list and mutation error display so messages are consistent and safe.
 */
export function toHumanMessage(err: unknown): string {
  if (err == null)
    return 'Something went wrong.';
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const msg = (err as { message: unknown }).message;
    if (typeof msg === 'string' && msg.length > 0)
      return msg;
  }
  if (err instanceof Error)
    return err.message || 'Something went wrong.';
  return 'Something went wrong.';
}
