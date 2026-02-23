import { IncomeEntry, CreateIncomeEntryInput } from '@/types/income';
import { getCurrentUserId } from '@/store/auth-store';
import { AuthRequiredError } from '@/lib/auth';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

const INCOME_ENTRIES_TABLE = 'income_entries';
const INCOME_LIST_LIMIT = 30;

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super('Supabase is not configured.');
    this.name = 'SupabaseNotConfiguredError';
  }
}

export async function listIncomeEntries(): Promise<IncomeEntry[]> {
  const supabaseClient = getSupabaseClient();
  if (!isSupabaseConfigured() || !supabaseClient) return [];
  const userId = getCurrentUserId();
  if (!userId) return [];
  const { data, error } = await supabaseClient
    .from(INCOME_ENTRIES_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(INCOME_LIST_LIMIT);
  if (error) throw error;
  return (data ?? []) as IncomeEntry[];
}

export async function createIncomeEntry(
  input: CreateIncomeEntryInput,
): Promise<IncomeEntry> {
  const supabaseClient = getSupabaseClient();
  if (!isSupabaseConfigured() || !supabaseClient) throw new SupabaseNotConfiguredError();
  const userId = getCurrentUserId();
  if (!userId) throw new AuthRequiredError();
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
  if (error) throw error;
  return data as IncomeEntry;
}
