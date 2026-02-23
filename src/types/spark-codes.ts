/**
 * Client-side type for spark_codes (matches Supabase table).
 */
export type SparkCode = {
  id: string;
  user_id: string;
  code: string;
  video_url: string | null;
  brand_name: string | null;
  platform: string | null;
  status: 'draft' | 'sent_to_brand' | 'active' | 'expired';
  expires_at: string | null; // ISO timestamp
  note: string | null;
  created_at: string; // ISO datetime
};

/**
 * Input for creating a new Spark code (omit id, user_id, created_at).
 */
export type CreateSparkCodeInput = Omit<
  SparkCode,
  'id' | 'user_id' | 'created_at'
>;

/**
 * Default values for optional fields when creating a Spark code.
 */
export function getDefaultSparkCodeInput(
  overrides: Partial<CreateSparkCodeInput> = {},
): CreateSparkCodeInput {
  return {
    code: '',
    video_url: null,
    brand_name: null,
    platform: null,
    status: 'draft',
    expires_at: null,
    note: null,
    ...overrides,
  };
}
