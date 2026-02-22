/**
 * Client-side type for contracts (matches Supabase table).
 */
export type Contract = {
  id: string;
  user_id: string;
  brand_name: string;
  contact_name: string | null;
  contact_email: string | null;
  deliverables: string | null;
  platform: string | null;
  fee_amount: number | null;
  currency: string | null;
  status: 'draft' | 'negotiating' | 'signed' | 'content_delivered' | 'paid';
  start_date: string | null; // ISO date
  due_date: string | null; // ISO date
  payment_due_date: string | null; // ISO date
  usage_rights_notes: string | null;
  attachment_urls: string[];
  created_at: string; // ISO datetime
};

/**
 * Input for creating a new contract (omit id, user_id, created_at).
 */
export type CreateContractInput = Omit<
  Contract,
  'id' | 'user_id' | 'created_at'
>;

/**
 * Default values for optional fields when creating a contract.
 */
export function getDefaultContractInput(
  overrides: Partial<CreateContractInput> = {},
): CreateContractInput {
  return {
    brand_name: '',
    contact_name: null,
    contact_email: null,
    deliverables: null,
    platform: null,
    fee_amount: null,
    currency: null,
    status: 'draft',
    start_date: null,
    due_date: null,
    payment_due_date: null,
    usage_rights_notes: null,
    attachment_urls: [],
    ...overrides,
  };
}
