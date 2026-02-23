import { Profile } from '@/types/profile';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

const PROFILES_TABLE = 'profiles';

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const supabaseClient = getSupabaseClient();
  if (!isSupabaseConfigured() || !supabaseClient) {
    return null;
  }
  const { data, error } = await supabaseClient
    .from(PROFILES_TABLE)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data as Profile | null;
}

export async function createProfile(input: { user_id: string; first_name: string }): Promise<void> {
  const supabaseClient = getSupabaseClient();
  if (!isSupabaseConfigured() || !supabaseClient) {
    throw new Error('Supabase is not configured.');
  }
  const { error } = await supabaseClient
    .from(PROFILES_TABLE)
    .insert({ user_id: input.user_id, first_name: input.first_name.trim() });
  if (error) {
    if (error.code === '42501') {
      console.warn('Profiles RLS blocking insert.');
      return;
    }
    throw error;
  }
}

export async function updateProfile(
  userId: string,
  input: { first_name: string },
): Promise<void> {
  const supabaseClient = getSupabaseClient();
  if (!isSupabaseConfigured() || !supabaseClient) {
    throw new Error('Supabase is not configured.');
  }
  const { error } = await supabaseClient
    .from(PROFILES_TABLE)
    .update({ first_name: input.first_name.trim() })
    .eq('user_id', userId);
  if (error) {
    throw error;
  }
}
