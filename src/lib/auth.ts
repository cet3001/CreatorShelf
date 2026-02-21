import type { User } from '@supabase/supabase-js';

import { isSupabaseConfigured, supabaseClient } from '@/lib/supabase';

export class AuthRequiredError extends Error {
  constructor() {
    super('You must be signed in to perform this action.');
    this.name = 'AuthRequiredError';
  }
}

/**
 * Get the currently signed-in Supabase user, or null.
 */
export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured() || !supabaseClient) {
    return null;
  }
  const { data: { user }, error } = await supabaseClient.auth.getUser();
  if (error || !user) {
    return null;
  }
  return user;
}

/**
 * Sign up with email and password. Returns the user on success.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<User> {
  if (!isSupabaseConfigured() || !supabaseClient) {
    throw new Error('Supabase is not configured.');
  }
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) {
    throw error;
  }
  if (!data.user) {
    throw new Error('Sign up did not return a user.');
  }
  return data.user;
}

/**
 * Sign in with email and password. Returns the user on success.
 */
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<User> {
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

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  if (isSupabaseConfigured() && supabaseClient) {
    await supabaseClient.auth.signOut();
  }
}
