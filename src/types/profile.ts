/**
 * Client-side type for profiles (matches Supabase table).
 */
export type Profile = {
  id: string;
  user_id: string;
  first_name: string;
  created_at: string;
};
