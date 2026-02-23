import { SparkCode, CreateSparkCodeInput, SparkCodeWithStats } from '@/types/spark-codes';
import { getCurrentUserId } from '@/store/auth-store';
import { AuthRequiredError } from '@/lib/auth';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { generateShortCode } from '@/lib/short-code';

const SPARK_CODES_TABLE = 'spark_codes';
const SCAN_EVENTS_TABLE = 'scan_events';
const SPARK_CODES_LIMIT = 50;

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super('Supabase is not configured.');
    this.name = 'SupabaseNotConfiguredError';
  }
}

export async function listSparkCodes(): Promise<SparkCode[]> {
  const supabaseClient = getSupabaseClient();
  if (!isSupabaseConfigured() || !supabaseClient) return [];
  const userId = getCurrentUserId();
  if (!userId) return [];
  const { data, error } = await supabaseClient
    .from(SPARK_CODES_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(SPARK_CODES_LIMIT);
  if (error) throw error;
  return (data ?? []) as SparkCode[];
}

export async function listSparkCodesWithStats(): Promise<SparkCodeWithStats[]> {
  const supabaseClient = getSupabaseClient();
  if (!isSupabaseConfigured() || !supabaseClient) return [];
  const userId = getCurrentUserId();
  if (!userId) return [];

  const { data: codes, error } = await supabaseClient
    .from(SPARK_CODES_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(SPARK_CODES_LIMIT);
  if (error) throw error;
  if (!codes || codes.length === 0) return [];

  const codeIds = codes.map((c: SparkCode) => c.id);
  const { data: scanCounts, error: scanError } = await supabaseClient
    .from(SCAN_EVENTS_TABLE)
    .select('spark_code_id')
    .in('spark_code_id', codeIds);

  if (scanError) {
    console.log('[SparkCodes] scan count query error (table may not exist yet):', scanError.message);
    return codes.map((c: SparkCode) => ({ ...c, total_scans: 0 }));
  }

  const countMap: Record<string, number> = {};
  (scanCounts ?? []).forEach((row: { spark_code_id: string }) => {
    countMap[row.spark_code_id] = (countMap[row.spark_code_id] ?? 0) + 1;
  });

  return codes.map((c: SparkCode) => ({
    ...c,
    total_scans: countMap[c.id] ?? 0,
  }));
}

export async function getSparkCodeById(id: string): Promise<SparkCode | null> {
  const supabaseClient = getSupabaseClient();
  if (!isSupabaseConfigured() || !supabaseClient) return null;
  const userId = getCurrentUserId();
  if (!userId) return null;
  const { data, error } = await supabaseClient
    .from(SPARK_CODES_TABLE)
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
  if (error) {
    console.log('[SparkCodes] getById error:', error.message);
    return null;
  }
  return data as SparkCode;
}

async function ensureUniqueShortCode(supabaseClient: any): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const candidate = generateShortCode();
    const { data } = await supabaseClient
      .from(SPARK_CODES_TABLE)
      .select('id')
      .eq('short_code', candidate)
      .maybeSingle();
    if (!data) return candidate;
    attempts++;
  }
  return generateShortCode(12);
}

export async function createSparkCode(
  input: CreateSparkCodeInput,
): Promise<SparkCode> {
  const supabaseClient = getSupabaseClient();
  if (!isSupabaseConfigured() || !supabaseClient) throw new SupabaseNotConfiguredError();
  const userId = getCurrentUserId();
  if (!userId) throw new AuthRequiredError();

  const shortCode = await ensureUniqueShortCode(supabaseClient);

  const row = {
    user_id: userId,
    code: input.code,
    destination_url: input.destination_url ?? null,
    deep_link_ios: input.deep_link_ios ?? null,
    deep_link_android: input.deep_link_android ?? null,
    short_code: shortCode,
    is_active: input.is_active ?? true,
    brand_name: input.brand_name ?? null,
    platform: input.platform ?? null,
    status: input.status,
    expires_at: input.expires_at ?? null,
    note: input.note ?? null,
  };
  console.log('[SparkCodes] creating with short_code:', shortCode);
  const { data, error } = await supabaseClient
    .from(SPARK_CODES_TABLE)
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return data as SparkCode;
}

export async function updateSparkCode(
  id: string,
  updates: Partial<Omit<SparkCode, 'id' | 'user_id' | 'created_at' | 'short_code'>>,
): Promise<SparkCode> {
  const supabaseClient = getSupabaseClient();
  if (!isSupabaseConfigured() || !supabaseClient) throw new SupabaseNotConfiguredError();
  const userId = getCurrentUserId();
  if (!userId) throw new AuthRequiredError();
  const { data, error } = await supabaseClient
    .from(SPARK_CODES_TABLE)
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data as SparkCode;
}
