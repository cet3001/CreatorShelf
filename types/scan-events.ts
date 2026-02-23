export type ScanEvent = {
  id: string;
  spark_code_id: string;
  scanned_at: string;
  device_type: string | null;
  os: string | null;
  country: string | null;
  city: string | null;
  ip_hash: string | null;
};

export type ScanAnalytics = {
  total_scans: number;
  scans_by_day: { date: string; count: number }[];
  scans_by_device: { device_type: string; count: number }[];
  scans_by_os: { os: string; count: number }[];
  scans_by_country: { country: string; count: number }[];
};
