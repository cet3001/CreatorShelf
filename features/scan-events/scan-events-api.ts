import { ScanEvent, ScanAnalytics } from '@/types/scan-events';
import { getCurrentUserId } from '@/store/auth-store';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

const SCAN_EVENTS_TABLE = 'scan_events';
const SPARK_CODES_TABLE = 'spark_codes';

export async function getScanEventsForCode(sparkCodeId: string): Promise<ScanEvent[]> {
  const supabaseClient = getSupabaseClient();
  if (!isSupabaseConfigured() || !supabaseClient) return [];
  const userId = getCurrentUserId();
  if (!userId) return [];

  const { data: code } = await supabaseClient
    .from(SPARK_CODES_TABLE)
    .select('id')
    .eq('id', sparkCodeId)
    .eq('user_id', userId)
    .single();
  if (!code) return [];

  const { data, error } = await supabaseClient
    .from(SCAN_EVENTS_TABLE)
    .select('*')
    .eq('spark_code_id', sparkCodeId)
    .order('scanned_at', { ascending: false })
    .limit(500);

  if (error) {
    console.log('[ScanEvents] query error:', error.message);
    return [];
  }
  return (data ?? []) as ScanEvent[];
}

export async function getAnalyticsForCode(sparkCodeId: string): Promise<ScanAnalytics> {
  const events = await getScanEventsForCode(sparkCodeId);

  const total_scans = events.length;

  const dayMap: Record<string, number> = {};
  const deviceMap: Record<string, number> = {};
  const osMap: Record<string, number> = {};
  const countryMap: Record<string, number> = {};

  for (const ev of events) {
    const day = ev.scanned_at ? ev.scanned_at.slice(0, 10) : 'unknown';
    dayMap[day] = (dayMap[day] ?? 0) + 1;

    const device = ev.device_type ?? 'Unknown';
    deviceMap[device] = (deviceMap[device] ?? 0) + 1;

    const os = ev.os ?? 'Unknown';
    osMap[os] = (osMap[os] ?? 0) + 1;

    const country = ev.country ?? 'Unknown';
    countryMap[country] = (countryMap[country] ?? 0) + 1;
  }

  const scans_by_day = Object.entries(dayMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const scans_by_device = Object.entries(deviceMap)
    .map(([device_type, count]) => ({ device_type, count }))
    .sort((a, b) => b.count - a.count);

  const scans_by_os = Object.entries(osMap)
    .map(([os, count]) => ({ os, count }))
    .sort((a, b) => b.count - a.count);

  const scans_by_country = Object.entries(countryMap)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);

  return { total_scans, scans_by_day, scans_by_device, scans_by_os, scans_by_country };
}
