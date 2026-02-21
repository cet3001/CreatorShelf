import type { Contract, CreateContractInput } from '@/types/contracts';

import { createMutation, createQuery } from 'react-query-kit';
import { getCurrentUserId } from '@/features/auth/use-auth-store';
import { AuthRequiredError } from '@/lib/auth';
import { isSupabaseConfigured, supabaseClient } from '@/lib/supabase';

/**
 * SQL for contracts — run in Supabase SQL Editor.
 *
 * --- OPTION A: Dev (no auth yet) ---
 *
 * create table public.contracts (
 *   id uuid primary key default gen_random_uuid(),
 *   user_id uuid not null,
 *   brand_name text not null,
 *   contact_name text,
 *   contact_email text,
 *   deliverables text,
 *   platform text,
 *   fee_amount numeric(12, 2),
 *   currency text,
 *   status text not null default 'draft',
 *   start_date date,
 *   due_date date,
 *   payment_due_date date,
 *   usage_rights_notes text,
 *   created_at timestamptz not null default now()
 * );
 * alter table public.contracts enable row level security;
 * create policy "Allow all for dev"
 *   on public.contracts for all
 *   using (true)
 *   with check (true);
 *
 * --- OPTION B: Production (with Auth) ---
 * Add: user_id uuid not null references auth.users(id) on delete cascade,
 * Then replace policy with auth.uid() = user_id for select/insert/update/delete.
 */

const CONTRACTS_TABLE = 'contracts';
const CONTRACTS_LIMIT = 50;

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super('Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env');
    this.name = 'SupabaseNotConfiguredError';
  }
}

export async function listContracts(): Promise<Contract[]> {
  if (!isSupabaseConfigured() || !supabaseClient) {
    return [];
  }

  const userId = getCurrentUserId();
  if (!userId) {
    return [];
  }

  const { data, error } = await supabaseClient
    .from(CONTRACTS_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(CONTRACTS_LIMIT);

  if (error) {
    throw error;
  }

  return (data ?? []) as Contract[];
}

export async function createContract(
  input: CreateContractInput,
): Promise<Contract> {
  if (!isSupabaseConfigured() || !supabaseClient) {
    throw new SupabaseNotConfiguredError();
  }

  const userId = getCurrentUserId();
  if (!userId) {
    throw new AuthRequiredError();
  }

  const row = {
    user_id: userId,
    brand_name: input.brand_name,
    contact_name: input.contact_name ?? null,
    contact_email: input.contact_email ?? null,
    deliverables: input.deliverables ?? null,
    platform: input.platform ?? null,
    fee_amount: input.fee_amount ?? null,
    currency: input.currency ?? null,
    status: input.status,
    start_date: input.start_date ?? null,
    due_date: input.due_date ?? null,
    payment_due_date: input.payment_due_date ?? null,
    usage_rights_notes: input.usage_rights_notes ?? null,
  };

  const { data, error } = await supabaseClient
    .from(CONTRACTS_TABLE)
    .insert(row)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Contract;
}

type ContractsResponse = Contract[];
type ContractsVariables = void;

export const useContractsQuery = createQuery<
  ContractsResponse,
  ContractsVariables,
  Error
>({
  queryKey: ['contracts', 'list'],
  fetcher: () => listContracts(),
});

type CreateContractResponse = Contract;
type CreateContractVariables = CreateContractInput;

export const useCreateContractMutation = createMutation<
  CreateContractResponse,
  CreateContractVariables,
  Error
>({
  mutationFn: variables => createContract(variables),
});
