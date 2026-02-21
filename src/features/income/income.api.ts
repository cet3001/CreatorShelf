import type { CreateIncomeEntryInput, IncomeEntry } from '@/types/income';

import { createMutation, createQuery } from 'react-query-kit';
import { getCurrentUserId } from '@/features/auth/use-auth-store';
import { AuthRequiredError } from '@/lib/auth';
import { isSupabaseConfigured, supabaseClient } from '@/lib/supabase';

/**
 * SQL for income_entries — run in Supabase SQL Editor.
 *
 * --- OPTION A: Dev (no auth yet) — run this first to smoke test ---
 * Creates table without FK to auth.users; RLS disabled so anon key can read/write.
 * When you add Supabase Auth, run OPTION B (or create a new table and migrate).
 *
 * create table public.income_entries (
 *   id uuid primary key default gen_random_uuid(),
 *   user_id uuid not null,
 *   date date not null,
 *   amount numeric(12, 2) not null,
 *   currency text not null default 'USD',
 *   platform text not null,
 *   product_name text,
 *   brand_name text,
 *   note text,
 *   created_at timestamptz not null default now()
 * );
 * -- RLS off for dev (anon can read/write). Turn on and add policies when you add auth.
 * alter table public.income_entries enable row level security;
 * create policy "Allow all for dev"
 *   on public.income_entries for all
 *   using (true)
 *   with check (true);
 *
 * --- OPTION B: Production (with Auth) — run when auth is ready ---
 * FK to auth.users; RLS so users only see their own rows.
 *
 * create table public.income_entries (
 *   id uuid primary key default gen_random_uuid(),
 *   user_id uuid not null references auth.users(id) on delete cascade,
 *   date date not null,
 *   amount numeric(12, 2) not null,
 *   currency text not null default 'USD',
 *   platform text not null,
 *   product_name text,
 *   brand_name text,
 *   note text,
 *   created_at timestamptz not null default now()
 * );
 * alter table public.income_entries enable row level security;
 * create policy "Users can read own income"
 *   on public.income_entries for select using (auth.uid() = user_id);
 * create policy "Users can insert own income"
 *   on public.income_entries for insert with check (auth.uid() = user_id);
 * create policy "Users can update own income"
 *   on public.income_entries for update using (auth.uid() = user_id);
 * create policy "Users can delete own income"
 *   on public.income_entries for delete using (auth.uid() = user_id);
 *
 * --- Next steps (before production lock-in) ---
 * - Add index: create index idx_income_entries_user_date on public.income_entries (user_id, date desc);
 * - Optionally platform enum: create type platform_enum as enum ('TikTok', 'TikTok Shop', 'Amazon', 'YouTube', 'Other');
 */

const INCOME_ENTRIES_TABLE = 'income_entries';
const INCOME_LIST_LIMIT = 30;

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super('Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env');
    this.name = 'SupabaseNotConfiguredError';
  }
}

export async function listIncomeEntries(): Promise<IncomeEntry[]> {
  if (!isSupabaseConfigured() || !supabaseClient) {
    return [];
  }

  const userId = getCurrentUserId();
  if (!userId) {
    return [];
  }

  const { data, error } = await supabaseClient
    .from(INCOME_ENTRIES_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(INCOME_LIST_LIMIT);

  if (error) {
    throw error;
  }

  return (data ?? []) as IncomeEntry[];
}

export async function createIncomeEntry(
  input: CreateIncomeEntryInput,
): Promise<IncomeEntry> {
  if (!isSupabaseConfigured() || !supabaseClient) {
    throw new SupabaseNotConfiguredError();
  }

  const userId = getCurrentUserId();
  if (!userId) {
    throw new AuthRequiredError();
  }

  const row = {
    user_id: userId,
    date: input.date,
    amount: input.amount,
    currency: input.currency,
    platform: input.platform,
    product_name: input.product_name ?? null,
    brand_name: input.brand_name ?? null,
    note: input.note ?? null,
  };

  const { data, error } = await supabaseClient
    .from(INCOME_ENTRIES_TABLE)
    .insert(row)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as IncomeEntry;
}

// React Query hooks
type IncomeEntriesResponse = IncomeEntry[];
type IncomeEntriesVariables = void;

export const useIncomeEntriesQuery = createQuery<
  IncomeEntriesResponse,
  IncomeEntriesVariables,
  Error
>({
  queryKey: ['income', 'entries'],
  fetcher: () => listIncomeEntries(),
});

type CreateIncomeEntryResponse = IncomeEntry;
type CreateIncomeEntryVariables = CreateIncomeEntryInput;

export const useCreateIncomeEntryMutation = createMutation<
  CreateIncomeEntryResponse,
  CreateIncomeEntryVariables,
  Error
>({
  mutationFn: variables => createIncomeEntry(variables),
});
