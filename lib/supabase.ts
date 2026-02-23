import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;
let _initialized = false;

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export function getSupabaseClient(): SupabaseClient | null {
  if (_initialized) {
    return _supabase;
  }
  _initialized = true;

  const url = SUPABASE_URL.trim();
  const anonKey = SUPABASE_ANON_KEY.trim();

  if (!url || !anonKey) {
    console.log('[Supabase] URL or ANON_KEY missing. Features will show setup message.');
    return null;
  }

  _supabase = createClient(url, anonKey);
  return _supabase;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseClient() !== null;
}
