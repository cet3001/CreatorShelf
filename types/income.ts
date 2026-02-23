export type IncomeEntry = {
  id: string;
  user_id: string;
  date: string;
  amount: number;
  currency: string;
  platform: string;
  product_name: string | null;
  brand_name: string | null;
  note: string | null;
  created_at: string;
};

export type CreateIncomeEntryInput = Omit<
  IncomeEntry,
  'id' | 'user_id' | 'created_at'
>;
