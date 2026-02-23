export type SparkCode = {
  id: string;
  user_id: string;
  code: string;
  destination_url: string | null;
  deep_link_ios: string | null;
  deep_link_android: string | null;
  short_code: string;
  is_active: boolean;
  brand_name: string | null;
  platform: string | null;
  status: 'draft' | 'sent_to_brand' | 'active' | 'expired';
  expires_at: string | null;
  note: string | null;
  created_at: string;
};

export type CreateSparkCodeInput = Omit<
  SparkCode,
  'id' | 'user_id' | 'created_at' | 'short_code'
>;

export type SparkCodeWithStats = SparkCode & {
  total_scans: number;
};
