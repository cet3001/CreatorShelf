import { Contract, CreateContractInput } from '@/types/contracts';
import { getCurrentUserId } from '@/store/auth-store';
import { AuthRequiredError } from '@/lib/auth';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

const CONTRACTS_TABLE = 'contracts';
const CONTRACTS_LIMIT = 50;

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super('Supabase is not configured.');
    this.name = 'SupabaseNotConfiguredError';
  }
}

export async function listContracts(): Promise<Contract[]> {
  const supabaseClient = getSupabaseClient();
  if (!isSupabaseConfigured() || !supabaseClient) return [];
  const userId = getCurrentUserId();
  if (!userId) return [];
  const { data, error } = await supabaseClient
    .from(CONTRACTS_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(CONTRACTS_LIMIT);
  if (error) throw error;
  return (data ?? []) as Contract[];
}

export async function createContract(
  input: CreateContractInput,
): Promise<Contract> {
  const supabaseClient = getSupabaseClient();
  if (!isSupabaseConfigured() || !supabaseClient) throw new SupabaseNotConfiguredError();
  const userId = getCurrentUserId();
  if (!userId) throw new AuthRequiredError();
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
  if (error) throw error;
  return data as Contract;
}

const CONTRACT_ATTACHMENTS_BUCKET = 'contract-attachments';

export async function uploadContractAttachments(
  userId: string,
  contractId: string,
  files: { uri: string; name: string }[],
): Promise<string[]> {
  const supabaseClient = getSupabaseClient();
  if (!isSupabaseConfigured() || !supabaseClient) throw new SupabaseNotConfiguredError();
  const paths: string[] = [];
  for (const file of files) {
    const fileName = file.name || `file-${Date.now()}`;
    const path = `${userId}/${contractId}/${fileName}`;
    const response = await fetch(file.uri);
    const blob = await response.blob();
    const { error } = await supabaseClient.storage
      .from(CONTRACT_ATTACHMENTS_BUCKET)
      .upload(path, blob, { contentType: blob.type || 'application/octet-stream', upsert: true });
    if (error) throw error;
    paths.push(path);
  }
  return paths;
}

export async function updateContractAttachmentUrls(
  contractId: string,
  attachmentUrls: string[],
): Promise<void> {
  const supabaseClient = getSupabaseClient();
  if (!isSupabaseConfigured() || !supabaseClient) throw new SupabaseNotConfiguredError();
  const { error } = await supabaseClient
    .from(CONTRACTS_TABLE)
    .update({ attachment_urls: attachmentUrls })
    .eq('id', contractId);
  if (error) throw error;
}
