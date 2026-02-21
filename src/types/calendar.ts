/**
 * Client-side type for calendar_events (matches Supabase table).
 */
export type CalendarEvent = {
  id: string;
  user_id: string;
  date: string; // ISO date (YYYY-MM-DD)
  type: 'seasonal' | 'launch' | 'other';
  title: string;
  description: string | null;
  product_name: string | null;
  product_category: string | null;
  seasonal_key: string | null;
  created_at: string; // ISO datetime
};

/**
 * Input for creating a new calendar event (omit id, user_id, created_at).
 */
export type CreateCalendarEventInput = Omit<
  CalendarEvent,
  'id' | 'user_id' | 'created_at'
>;

/**
 * Default values for optional fields when creating an event.
 */
export function getDefaultCalendarEventInput(
  overrides: Partial<CreateCalendarEventInput> = {},
): CreateCalendarEventInput {
  const today = new Date().toISOString().slice(0, 10);
  return {
    date: today,
    type: 'other',
    title: '',
    description: null,
    product_name: null,
    product_category: null,
    seasonal_key: null,
    ...overrides,
  };
}
