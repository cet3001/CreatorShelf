import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

import Env from 'env';

/**
 * Supabase client — lazy singleton.
 *
 * Uses getSupabaseClient() so the client is created on first use rather than
 * at module load time. This prevents the client from being permanently null
 * when the module is evaluated before env vars are available (e.g. during
 * Metro hot reload or in certain bundler evaluation orders).
 *
 * Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env,
 * then restart Metro: npx expo start -c
 */
let _supabase: SupabaseClient | null = null;
let _initialized = false;

export function getSupabaseClient(): SupabaseClient | null {
  if (_initialized) {
    return _supabase;
  }
  _initialized = true;

  const url = Env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const anonKey = Env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

  if (!url || !anonKey) {
    if (__DEV__) {
      console.warn(
        '[Supabase] EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is missing. '
        + 'Add them to .env to enable Supabase. Income and other features will show a setup message.',
      );
    }
    return null;
  }

  _supabase = createClient(url, anonKey);
  return _supabase;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseClient() !== null;
}

/** @deprecated Use getSupabaseClient() instead. Kept for import compatibility. */
export const supabaseClient = getSupabaseClient();
