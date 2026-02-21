import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

import Env from 'env';

/**
 * Supabase client. Only created when EXPO_PUBLIC_SUPABASE_URL and
 * EXPO_PUBLIC_SUPABASE_ANON_KEY are set in .env (paste your project URL and
 * anon key from Supabase dashboard → Project Settings → API).
 */
let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (supabase !== null)
    return supabase;

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

  supabase = createClient(url, anonKey);
  return supabase;
}

export const supabaseClient = getSupabase();

export function isSupabaseConfigured(): boolean {
  return supabaseClient !== null;
}
