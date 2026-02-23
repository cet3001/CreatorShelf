import type { Contract, CreateContractInput } from '@/types/contracts';

import { createMutation, createQuery } from 'react-query-kit';
import { getCurrentUserId } from '@/features/auth/use-auth-store';
import { AuthRequiredError } from '@/lib/auth';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

/**
 * SQL for contracts — run in Supabase SQL Editor.
 *
 * --- Storage bucket for contract attachments ---
 * insert into storage.buckets (id, name, public)
 * values ('contract-attachments', 'contract-attachments', false);
 *
 * create policy "Users can upload own attachments"
 *   on storage.objects for insert
 *   with check (auth.uid()::text = (storage.foldername(name))[1]);
 *
 * create policy "Users can view own attachments"
 *   on storage.objects for select
 *   using (auth.uid()::text = (storage.foldername(name))[1]);
 *
 * --- Add attachment_urls column to contracts ---
 * alter table public.contracts
 *   add column if not exists attachment_urls text[] default '{}';
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
  const supabaseClient = getSupabaseClient();
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
    attachment_urls: input.attachment_urls ?? [],
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

const CONTRACT_ATTACHMENTS_BUCKET = 'contract-attachments';

/**
 * Upload files to contract-attachments bucket at {user_id}/{contract_id}/{filename}.
 * Returns storage paths for each file (to store in contract.attachment_urls).
 */
export async function uploadContractAttachments(
  userId: string,
  contractId: string,
  files: { uri: string; name: string }[],
): Promise<string[]> {
  const supabaseClient = getSupabaseClient();
  if (!isSupabaseConfigured() || !supabaseClient) {
    throw new SupabaseNotConfiguredError();
  }

  const paths: string[] = [];
  for (const file of files) {
    const fileName = file.name || `file-${Date.now()}`;
    const path = `${userId}/${contractId}/${fileName}`;
    const response = await fetch(file.uri);
    const blob = await response.blob();
    const { error } = await supabaseClient.storage
      .from(CONTRACT_ATTACHMENTS_BUCKET)
      .upload(path, blob, { contentType: blob.type || 'application/octet-stream', upsert: true });
    if (error) {
      throw error;
    }
    paths.push(path);
  }
  return paths;
}

export async function updateContractAttachmentUrls(
  contractId: string,
  attachmentUrls: string[],
): Promise<void> {
  const supabaseClient = getSupabaseClient();
  if (!isSupabaseConfigured() || !supabaseClient) {
    throw new SupabaseNotConfiguredError();
  }

  const { error } = await supabaseClient
    .from(CONTRACTS_TABLE)
    .update({ attachment_urls: attachmentUrls })
    .eq('id', contractId);

  if (error) {
    throw error;
  }
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

/*
 * Run this once in Supabase SQL editor to create the table if it doesn't exist.
 *
 * -- contracts
 * create table if not exists public.contracts (
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
 * create policy "Allow all for dev contracts"
 *   on public.contracts for all
 *   using (true)
 *   with check (true);
 */
