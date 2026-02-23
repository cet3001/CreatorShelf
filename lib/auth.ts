import { User } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

export class AuthRequiredError extends Error {
  constructor() {
    super('You must be signed in to perform this action.');
    this.name = 'AuthRequiredError';
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const supabaseClient = getSupabaseClient();
  if (!isSupabaseConfigured() || !supabaseClient) {
    return null;
  }
  const { data: { user }, error } = await supabaseClient.auth.getUser();
  if (error || !user) {
    return null;
  }
  return user;
}

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<User | null> {
  const supabaseClient = getSupabaseClient();
  if (!isSupabaseConfigured() || !supabaseClient) {
    throw new Error('Supabase is not configured.');
  }
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) {
    throw error;
  }
  return data.user ?? null;
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<User> {
  const supabaseClient = getSupabaseClient();
  if (!isSupabaseConfigured() || !supabaseClient) {
    throw new Error('Supabase is not configured.');
  }
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    throw error;
  }
  if (!data.user) {
    throw new Error('Sign in did not return a user.');
  }
  return data.user;
}

export async function signOutUser(): Promise<void> {
  const supabaseClient = getSupabaseClient();
  if (isSupabaseConfigured() && supabaseClient) {
    await supabaseClient.auth.signOut();
  }
}
