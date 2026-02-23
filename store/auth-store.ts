import { User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { getCurrentUser, signOutUser } from '@/lib/auth';

type AuthStatus = 'idle' | 'loading' | 'signIn' | 'signOut';

type AuthState = {
  user: User | null;
  status: AuthStatus;
  signIn: (user: User) => void;
  signOut: () => Promise<void>;
  hydrate: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',
  signIn: (user) => {
    console.log('[Auth] signIn', user.email);
    set({ user, status: 'signIn' });
  },
  signOut: async () => {
    console.log('[Auth] signOut');
    await signOutUser();
    set({ user: null, status: 'signOut' });
  },
  hydrate: () => {
    console.log('[Auth] hydrating...');
    set({ status: 'loading' });
    getCurrentUser()
      .then((user) => {
        console.log('[Auth] hydrated, user:', user?.email ?? 'none');
        set({ user, status: user ? 'signIn' : 'signOut' });
      })
      .catch((err) => {
        console.log('[Auth] hydration error:', err);
        set({ user: null, status: 'signOut' });
      });
  },
}));

export function getCurrentUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}
