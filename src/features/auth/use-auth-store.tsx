import type { User } from '@supabase/supabase-js';

import { create } from 'zustand';

import { getCurrentUser as fetchCurrentUser, signOut as supabaseSignOut } from '@/lib/auth';
import { createSelectors } from '@/lib/utils';

type AuthState = {
  user: User | null;
  status: 'idle' | 'loading' | 'signIn' | 'signOut';
  signIn: (user: User) => void;
  signOut: () => Promise<void>;
  hydrate: () => void;
};

const _useAuthStore = create<AuthState>(set => ({
  user: null,
  status: 'idle',
  signIn: (user) => {
    set({ user, status: 'signIn' });
  },
  signOut: async () => {
    await supabaseSignOut();
    set({ user: null, status: 'signOut' });
  },
  hydrate: () => {
    set({ status: 'loading' });
    fetchCurrentUser()
      .then((user) => {
        set({ user, status: user ? 'signIn' : 'signOut' });
      })
      .catch(() => {
        set({ user: null, status: 'signOut' });
      });
  },
}));

export const useAuthStore = createSelectors(_useAuthStore);

export const signOut = () => _useAuthStore.getState().signOut();
export const signIn = (user: User) => _useAuthStore.getState().signIn(user);

/** Call from API layer (sync). Returns current user id or null. */
export function getCurrentUserId(): string | null {
  return _useAuthStore.getState().user?.id ?? null;
}

export const hydrateAuth = () => _useAuthStore.getState().hydrate();
