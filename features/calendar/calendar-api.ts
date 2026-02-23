import { CalendarEvent, CreateCalendarEventInput } from '@/types/calendar';
import { getCurrentUserId } from '@/store/auth-store';
import { AuthRequiredError } from '@/lib/auth';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

const CALENDAR_EVENTS_TABLE = 'calendar_events';
const UPCOMING_DAYS = 90;

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super('Supabase is not configured.');
    this.name = 'SupabaseNotConfiguredError';
  }
}

function getUpcomingDateRange(): { from: string; to: string } {
  const from = new Date();
  const to = new Date();
  to.setDate(to.getDate() + UPCOMING_DAYS);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export async function listCalendarEvents(): Promise<CalendarEvent[]> {
  const supabaseClient = getSupabaseClient();
  if (!isSupabaseConfigured() || !supabaseClient) return [];
  const userId = getCurrentUserId();
  if (!userId) return [];
  const { from, to } = getUpcomingDateRange();
  const { data, error } = await supabaseClient
    .from(CALENDAR_EVENTS_TABLE)
    .select('*')
    .eq('user_id', userId)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as CalendarEvent[];
}

export async function createCalendarEvent(
  input: CreateCalendarEventInput,
): Promise<CalendarEvent> {
  const supabaseClient = getSupabaseClient();
  if (!isSupabaseConfigured() || !supabaseClient) throw new SupabaseNotConfiguredError();
  const userId = getCurrentUserId();
  if (!userId) throw new AuthRequiredError();
  const row = {
    user_id: userId,
    date: input.date,
    type: input.type,
    title: input.title,
    description: input.description ?? null,
    product_name: input.product_name ?? null,
    product_category: input.product_category ?? null,
    seasonal_key: input.seasonal_key ?? null,
  };
  const { data, error } = await supabaseClient
    .from(CALENDAR_EVENTS_TABLE)
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return data as CalendarEvent;
}
