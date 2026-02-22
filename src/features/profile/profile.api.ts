import type { Profile } from '@/types/profile';

import { createQuery } from 'react-query-kit';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

/*
 * MUST RUN IN SUPABASE SQL EDITOR BEFORE PROFILES WILL WORK:
 *
 * drop policy if exists "Allow all for dev profiles" on public.profiles;
 * drop policy if exists "Users can view own profile" on public.profiles;
 * drop policy if exists "Users can insert own profile" on public.profiles;
 * drop policy if exists "Users can update own profile" on public.profiles;
 *
 * create policy "Users can view own profile"
 *   on public.profiles for select
 *   using (auth.uid() = user_id);
 *
 * create policy "Users can insert own profile"
 *   on public.profiles for insert
 *   with check (auth.uid() = user_id);
 *
 * create policy "Users can update own profile"
 *   on public.profiles for update
 *   using (auth.uid() = user_id)
 *   with check (auth.uid() = user_id);
 */

const PROFILES_TABLE = 'profiles';

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super('Supabase is not configured.');
    this.name = 'SupabaseNotConfiguredError';
  }
}

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
    throw new SupabaseNotConfiguredError();
  }

  const { error } = await supabaseClient
    .from(PROFILES_TABLE)
    .insert({ user_id: input.user_id, first_name: input.first_name.trim() });

  if (error) {
    if (error.code === '42501') {
      console.warn(
        'Profiles RLS blocking insert. Run the SQL in profile.api.ts in Supabase SQL Editor.',
      );
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
    throw new SupabaseNotConfiguredError();
  }

  const { error } = await supabaseClient
    .from(PROFILES_TABLE)
    .update({ first_name: input.first_name.trim() })
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
}

type ProfileResponse = Profile | null;
type ProfileVariables = { userId: string | null };

const useProfileQueryBase = createQuery<
  ProfileResponse,
  ProfileVariables,
  Error
>({
  queryKey: ['profile'],
  fetcher: (variables) => {
    const userId = variables?.userId;
    if (!userId)
      return Promise.resolve(null);
    return getProfileByUserId(userId);
  },
});

/** Fetches the current user's profile. Runs only when signed in. */
export function useProfileQuery() {
  const userId = useAuthStore.use.user()?.id ?? null;
  return useProfileQueryBase({
    variables: { userId },
    enabled: !!userId,
  });
}

/*
 * Run this once in Supabase SQL editor to create the table if it doesn't exist.
 *
 * create table if not exists public.profiles (
 *   id uuid primary key default gen_random_uuid(),
 *   user_id uuid not null,
 *   first_name text not null,
 *   created_at timestamptz not null default now()
 * );
 * alter table public.profiles enable row level security;
 *
 * RLS policies (run in Supabase SQL Editor so inserts by the signed-in user succeed):
 *
 * drop policy if exists "Allow all for dev profiles" on public.profiles;
 * drop policy if exists "Users can view own profile" on public.profiles;
 * drop policy if exists "Users can insert own profile" on public.profiles;
 * drop policy if exists "Users can update own profile" on public.profiles;
 *
 * create policy "Users can view own profile"
 *   on public.profiles for select
 *   using (auth.uid() = user_id);
 *
 * create policy "Users can insert own profile"
 *   on public.profiles for insert
 *   with check (auth.uid() = user_id);
 *
 * create policy "Users can update own profile"
 *   on public.profiles for update
 *   using (auth.uid() = user_id)
 *   with check (auth.uid() = user_id);
 */
