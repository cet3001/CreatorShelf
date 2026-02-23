export type CalendarEvent = {
  id: string;
  user_id: string;
  date: string;
  type: 'seasonal' | 'launch' | 'other';
  title: string;
  description: string | null;
  product_name: string | null;
  product_category: string | null;
  seasonal_key: string | null;
  created_at: string;
};

export type CreateCalendarEventInput = Omit<
  CalendarEvent,
  'id' | 'user_id' | 'created_at'
>;
