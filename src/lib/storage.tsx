import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV();

/** MMKV key for first name collected during onboarding (used at sign-up for profile). */
export const ONBOARDING_FIRST_NAME = 'onboarding_first_name';

export function getItem<T>(key: string): T | null {
  const value = storage.getString(key);
  return value ? JSON.parse(value) || null : null;
}

export async function setItem<T>(key: string, value: T) {
  storage.set(key, JSON.stringify(value));
}

export async function removeItem(key: string) {
  storage.remove(key);
}
