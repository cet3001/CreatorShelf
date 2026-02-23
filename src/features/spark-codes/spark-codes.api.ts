import type { CreateSparkCodeInput, SparkCode } from '@/types/spark-codes';

import { createMutation, createQuery } from 'react-query-kit';
import { getCurrentUserId } from '@/features/auth/use-auth-store';
import { AuthRequiredError } from '@/lib/auth';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

/**
 * SQL for spark_codes — run in Supabase SQL Editor.
 *
 * --- OPTION A: Dev (no auth yet) ---
 *
 * create table public.spark_codes (
 *   id uuid primary key default gen_random_uuid(),
 *   user_id uuid not null,
 *   code text not null,
 *   video_url text,
 *   brand_name text,
 *   platform text,
 *   status text not null default 'draft',
 *   expires_at timestamptz,
 *   note text,
 *   created_at timestamptz not null default now()
 * );
 * alter table public.spark_codes enable row level security;
 * create policy "Allow all for dev"
 *   on public.spark_codes for all
 *   using (true)
 *   with check (true);
 *
 * --- OPTION B: Production (with Auth) ---
 * Add: user_id uuid not null references auth.users(id) on delete cascade,
 * Then replace policy with auth.uid() = user_id for select/insert/update/delete.
 */

const SPARK_CODES_TABLE = 'spark_codes';
const SPARK_CODES_LIMIT = 50;

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super('Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env');
    this.name = 'SupabaseNotConfiguredError';
  }
}

export async function listSparkCodes(): Promise<SparkCode[]> {
  const supabaseClient = getSupabaseClient();
  if (!isSupabaseConfigured() || !supabaseClient) {
    return [];
  }

  const userId = getCurrentUserId();
  if (!userId) {
    return [];
  }

  const { data, error } = await supabaseClient
    .from(SPARK_CODES_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(SPARK_CODES_LIMIT);

  if (error) {
    throw error;
  }

  return (data ?? []) as SparkCode[];
}

export async function createSparkCode(
  input: CreateSparkCodeInput,
): Promise<SparkCode> {
  const supabaseClient = getSupabaseClient();
  if (!isSupabaseConfigured() || !supabaseClient) {
    throw new SupabaseNotConfiguredError();
  }

  const userId = getCurrentUserId();
  if (!userId) {
    throw new AuthRequiredError();
  }

  const row = {
    user_id: userId,
    code: input.code,
    video_url: input.video_url ?? null,
    brand_name: input.brand_name ?? null,
    platform: input.platform ?? null,
    status: input.status,
    expires_at: input.expires_at ?? null,
    note: input.note ?? null,
  };

  const { data, error } = await supabaseClient
    .from(SPARK_CODES_TABLE)
    .insert(row)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as SparkCode;
}

type SparkCodesResponse = SparkCode[];
type SparkCodesVariables = void;

export const useSparkCodesQuery = createQuery<
  SparkCodesResponse,
  SparkCodesVariables,
  Error
>({
  queryKey: ['spark-codes', 'list'],
  fetcher: () => listSparkCodes(),
});

type CreateSparkCodeResponse = SparkCode;
type CreateSparkCodeVariables = CreateSparkCodeInput;

export const useCreateSparkCodeMutation = createMutation<
  CreateSparkCodeResponse,
  CreateSparkCodeVariables,
  Error
>({
  mutationFn: variables => createSparkCode(variables),
});

/*
 * Run this once in Supabase SQL editor to create the table if it doesn't exist.
 *
 * -- spark_codes
 * create table if not exists public.spark_codes (
 *   id uuid primary key default gen_random_uuid(),
 *   user_id uuid not null,
 *   code text not null,
 *   video_url text,
 *   brand_name text,
 *   platform text,
 *   status text not null default 'draft',
 *   expires_at timestamptz,
 *   note text,
 *   created_at timestamptz not null default now()
 * );
 * alter table public.spark_codes enable row level security;
 * create policy "Allow all for dev spark"
 *   on public.spark_codes for all
 *   using (true)
 *   with check (true);
 */
