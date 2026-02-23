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
  start_date: string | null;
  due_date: string | null;
  payment_due_date: string | null;
  usage_rights_notes: string | null;
  attachment_urls: string[];
  created_at: string;
};

export type CreateContractInput = Omit<
  Contract,
  'id' | 'user_id' | 'created_at'
>;
