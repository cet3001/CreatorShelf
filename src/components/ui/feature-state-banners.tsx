import * as React from 'react';
import { Text, View } from 'react-native';

/**
 * Shared "Supabase not configured" banner. Use on every feature tab when
 * isSupabaseConfigured() is false for consistent copy and styling.
 */
export function SupabaseNotConfiguredBanner({
  title = 'Supabase not configured',
  hint = 'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file, then run the SQL in the feature API file to create the table.',
}: {
  title?: string;
  hint?: string;
}) {
  return (
    <View className="rounded-2xl border border-neutral-300/80 bg-neutral-100/95 p-4 dark:border-neutral-600/80 dark:bg-neutral-800/95">
      <Text className="font-semibold text-neutral-800 dark:text-neutral-200">
        {title}
      </Text>
      <Text className="mt-2 text-sm text-muted-foreground">
        {hint}
      </Text>
    </View>
  );
}

/**
 * Shared list/query error banner. Use when React Query error is set.
 */
export function ListErrorBanner({
  message,
  retryHint = 'Pull to retry.',
}: {
  message: string;
  retryHint?: string;
}) {
  return (
    <View className="rounded-2xl border border-danger-200 bg-danger-50 p-4 dark:border-danger-800 dark:bg-danger-900/40">
      <Text className="font-medium text-danger-700 dark:text-danger-400">
        {message}
      </Text>
      {retryHint
        ? (
            <Text className="mt-1 text-sm text-danger-600 dark:text-danger-500">
              {retryHint}
            </Text>
          )
        : null}
    </View>
  );
}

/**
 * Shared empty state. Use when list loaded successfully but has no items.
 */
export function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <View className="rounded-2xl border border-neutral-200/80 bg-neutral-50/80 py-8 dark:border-neutral-700/80 dark:bg-neutral-800/50">
      <Text className="text-center text-muted-foreground">
        {message}
      </Text>
    </View>
  );
}
