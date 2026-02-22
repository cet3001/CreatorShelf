import type { CalendarEvent, CreateCalendarEventInput } from '@/types/calendar';

import { createMutation, createQuery } from 'react-query-kit';
import { getCurrentUserId } from '@/features/auth/use-auth-store';
import { AuthRequiredError } from '@/lib/auth';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

/**
 * SQL for calendar_events — run in Supabase SQL Editor.
 *
 * --- OPTION A: Dev (no auth yet) ---
 *
 * create table public.calendar_events (
 *   id uuid primary key default gen_random_uuid(),
 *   user_id uuid not null,
 *   date date not null,
 *   type text not null,
 *   title text not null,
 *   description text,
 *   product_name text,
 *   product_category text,
 *   seasonal_key text,
 *   created_at timestamptz not null default now()
 * );
 * alter table public.calendar_events enable row level security;
 * create policy "Allow all for dev"
 *   on public.calendar_events for all
 *   using (true)
 *   with check (true);
 *
 * --- OPTION B: Production (with Auth) ---
 * Add: user_id uuid not null references auth.users(id) on delete cascade,
 * Then replace policy with:
 * create policy "Users can read own calendar_events" on public.calendar_events for select using (auth.uid() = user_id);
 * create policy "Users can insert own calendar_events" on public.calendar_events for insert with check (auth.uid() = user_id);
 * create policy "Users can update own calendar_events" on public.calendar_events for update using (auth.uid() = user_id);
 * create policy "Users can delete own calendar_events" on public.calendar_events for delete using (auth.uid() = user_id);
 */

const CALENDAR_EVENTS_TABLE = 'calendar_events';
const UPCOMING_DAYS = 90;

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super('Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env');
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
  if (!isSupabaseConfigured() || !supabaseClient) {
    return [];
  }

  const userId = getCurrentUserId();
  if (!userId) {
    return [];
  }

  const { from, to } = getUpcomingDateRange();

  const { data, error } = await supabaseClient
    .from(CALENDAR_EVENTS_TABLE)
    .select('*')
    .eq('user_id', userId)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as CalendarEvent[];
}

export async function createCalendarEvent(
  input: CreateCalendarEventInput,
): Promise<CalendarEvent> {
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

  if (error) {
    throw error;
  }

  return data as CalendarEvent;
}

type CalendarEventsResponse = CalendarEvent[];
type CalendarEventsVariables = void;

export const useCalendarEventsQuery = createQuery<
  CalendarEventsResponse,
  CalendarEventsVariables,
  Error
>({
  queryKey: ['calendar', 'events'],
  fetcher: () => listCalendarEvents(),
});

type CreateCalendarEventResponse = CalendarEvent;
type CreateCalendarEventVariables = CreateCalendarEventInput;

export const useCreateCalendarEventMutation = createMutation<
  CreateCalendarEventResponse,
  CreateCalendarEventVariables,
  Error
>({
  mutationFn: variables => createCalendarEvent(variables),
});

/*
 * Run this once in Supabase SQL editor to create the table if it doesn't exist.
 *
 * -- calendar_events
 * create table if not exists public.calendar_events (
 *   id uuid primary key default gen_random_uuid(),
 *   user_id uuid not null,
 *   date date not null,
 *   type text not null,
 *   title text not null,
 *   description text,
 *   product_name text,
 *   product_category text,
 *   seasonal_key text,
 *   created_at timestamptz not null default now()
 * );
 * alter table public.calendar_events enable row level security;
 * create policy "Allow all for dev calendar"
 *   on public.calendar_events for all
 *   using (true)
 *   with check (true);
 */
