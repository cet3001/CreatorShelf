/**
 * Client-side type for income_entries (matches Supabase table).
 */
export type IncomeEntry = {
  id: string;
  user_id: string;
  date: string; // ISO date (YYYY-MM-DD)
  amount: number;
  currency: string;
  platform: string;
  product_name: string | null;
  brand_name: string | null;
  note: string | null;
  created_at: string; // ISO datetime
};

/**
 * Input for creating a new income entry (omit id, user_id, created_at).
 */
export type CreateIncomeEntryInput = Omit<
  IncomeEntry,
  'id' | 'user_id' | 'created_at'
>;

/**
 * Default values for optional fields when creating an entry.
 */
export function getDefaultIncomeEntryInput(
  overrides: Partial<CreateIncomeEntryInput> = {},
): CreateIncomeEntryInput {
  const today = new Date().toISOString().slice(0, 10);
  return {
    date: today,
    amount: 0,
    currency: 'USD',
    platform: '',
    product_name: null,
    brand_name: null,
    note: null,
    ...overrides,
  };
}
