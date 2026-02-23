import type { IncomeEntry } from '@/types/income';
import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useMemo } from 'react';

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  SectionList,
} from 'react-native';
import * as z from 'zod';
import {
  Button,
  EmptyState,
  ListErrorBanner,
  Modal,
  SupabaseNotConfiguredBanner,
  Text,
  useModal,
  View,
} from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { Input } from '@/components/ui/input';
import { signOut } from '@/features/auth/use-auth-store';
import {
  SupabaseNotConfiguredError,
  useCreateIncomeEntryMutation,
  useIncomeEntriesQuery,
} from '@/features/income/income.api';
import { AuthRequiredError } from '@/lib/auth';
import { toHumanMessage } from '@/lib/error-message';
import { isSupabaseConfigured } from '@/lib/supabase';

const addIncomeSchemaOnChange = z.object({
  amount: z.union([z.literal(''), z.string()]).refine(
    s => s === '' || (!Number.isNaN(Number(s)) && Number(s) >= 0.01),
    'Amount must be greater than 0',
  ),
  date: z.string(),
  platform: z.string(),
  product_name: z.string().optional(),
  brand_name: z.string().optional(),
});

const addIncomeSchemaOnSubmit = z.object({
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  platform: z.string().min(1, 'Platform is required'),
  product_name: z.string().optional(),
  brand_name: z.string().optional(),
});

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function sumByDate(entries: IncomeEntry[], fromDate: string, toDate: string): number {
  return entries
    .filter(e => e.date >= fromDate && e.date <= toDate)
    .reduce((acc, e) => acc + e.amount, 0);
}

function groupEntriesByDate(entries: IncomeEntry[]): { date: string; items: IncomeEntry[] }[] {
  const byDate = new Map<string, IncomeEntry[]>();
  for (const e of entries) {
    const list = byDate.get(e.date) ?? [];
    list.push(e);
    byDate.set(e.date, list);
  }
  const sorted = Array.from(byDate.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  return sorted.map(([date, items]) => ({ date, items }));
}

const INCOME_TABLE_HINT = 'income_entries table.';

/* eslint-disable max-lines-per-function -- screen: list + modal form; extract subcomponents if needed */
export default function IncomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const configured = isSupabaseConfigured();
  const { data: entries = [], isLoading, error } = useIncomeEntriesQuery();
  const mutation = useCreateIncomeEntryMutation();
  const addIncomeModal = useModal();

  const form = useForm({
    defaultValues: {
      amount: '',
      date: getTodayISO(),
      platform: '',
      product_name: '',
      brand_name: '',
    },
    validators: {
      onChange: addIncomeSchemaOnChange as any,
      onSubmit: addIncomeSchemaOnSubmit as any,
    },
    onSubmit: async ({ value }) => {
      try {
        const amount = typeof value.amount === 'number' ? value.amount : Number(value.amount);
        await mutation.mutateAsync({
          amount: Number.isFinite(amount) ? amount : 0,
          date: value.date,
          currency: 'USD',
          platform: value.platform,
          product_name: value.product_name?.trim() || null,
          brand_name: value.brand_name?.trim() || null,
          note: null,
        });
        form.reset();
        addIncomeModal.dismiss();
        await queryClient.invalidateQueries({ queryKey: ['income', 'entries'] });
      }
      catch (err) {
        if (err instanceof SupabaseNotConfiguredError) {
          return;
        }
        if (err instanceof AuthRequiredError) {
          await signOut();
          router.replace('/(auth)/sign-in');
          return;
        }
        throw err;
      }
    },
  });

  const summary = useMemo(() => {
    const today = getTodayISO();
    const d = new Date();
    d.setDate(d.getDate() - 7);
    const sevenDaysAgo = d.toISOString().slice(0, 10);
    const d30 = new Date();
    d30.setDate(d30.getDate() - 30);
    const thirtyDaysAgo = d30.toISOString().slice(0, 10);
    return {
      today: sumByDate(entries, today, today),
      last7: sumByDate(entries, sevenDaysAgo, today),
      last30: sumByDate(entries, thirtyDaysAgo, today),
    };
  }, [entries]);

  const sections = useMemo(
    () => groupEntriesByDate(entries).map(({ date, items }) => ({ title: date, data: items })),
    [entries],
  );

  if (!configured) {
    return (
      <View className="flex-1 p-6">
        <Text className="mb-2 text-2xl font-bold">Income</Text>
        <Text className="mb-4 text-muted-foreground">
          Daily/weekly/monthly income tracking and bestsellers.
        </Text>
        <SupabaseNotConfiguredBanner hint={`Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file, then run the SQL in income.api.ts to create the ${INCOME_TABLE_HINT}`} />
      </View>
    );
  }

  const cardClass = 'rounded-2xl border border-neutral-200/80 bg-white/95 p-3 dark:border-neutral-600/50 dark:bg-neutral-800/95';

  const listHeader = (
    <View className="mb-6">
      <Text className="mb-2 text-2xl font-bold">Income</Text>
      <Text className="mb-4 text-muted-foreground">
        Daily/weekly/monthly income tracking and bestsellers.
      </Text>
      <View className="mb-6 flex-row gap-3">
        <View className="flex-1 rounded-2xl border border-neutral-200/80 bg-white/95 p-4 dark:border-neutral-600/50 dark:bg-neutral-800/95">
          <Text className="text-2xl font-semibold tabular-nums">{summary.today.toFixed(2)}</Text>
          <Text className="text-sm text-muted-foreground">Today</Text>
        </View>
        <View className="flex-1 rounded-2xl border border-neutral-200/80 bg-white/95 p-4 dark:border-neutral-600/50 dark:bg-neutral-800/95">
          <Text className="text-2xl font-semibold tabular-nums">{summary.last7.toFixed(2)}</Text>
          <Text className="text-sm text-muted-foreground">Last 7 days</Text>
        </View>
        <View className="flex-1 rounded-2xl border border-neutral-200/80 bg-white/95 p-4 dark:border-neutral-600/50 dark:bg-neutral-800/95">
          <Text className="text-2xl font-semibold tabular-nums">{summary.last30.toFixed(2)}</Text>
          <Text className="text-sm text-muted-foreground">Last 30 days</Text>
        </View>
      </View>
      <Text className="mb-2 text-lg font-semibold">Recent entries</Text>
      {isLoading && (
        <View className="py-8">
          <ActivityIndicator size="small" />
        </View>
      )}
      {error && (
        <View className="py-4">
          <ListErrorBanner message={toHumanMessage(error)} retryHint="Pull to retry." />
        </View>
      )}
      {!isLoading && !error && entries.length === 0 && (
        <EmptyState message="No income entries yet. Tap Add income below." />
      )}
    </View>
  );

  const listFooter = (
    <View className="pb-6">
      <Button
        label="Add income"
        variant="secondary"
        size="lg"
        onPress={() => addIncomeModal.present()}
        className="rounded-2xl"
      />
      {mutation.isError && !(mutation.error instanceof SupabaseNotConfiguredError) && !(mutation.error instanceof AuthRequiredError) && (
        <Text className="mt-2 text-sm text-danger-600">
          {toHumanMessage(mutation.error)}
        </Text>
      )}
    </View>
  );

  return (
    <>
      {!isLoading && !error && sections.length > 0
        ? (
            <SectionList
              className="flex-1"
              contentContainerStyle={{ padding: 24 }}
              sections={sections}
              keyExtractor={item => item.id}
              removeClippedSubviews
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              ListHeaderComponent={listHeader}
              ListFooterComponent={listFooter}
              renderSectionHeader={({ section: { title } }) => (
                <Text className="my-2 text-sm font-medium text-muted-foreground">{title}</Text>
              )}
              renderItem={({ item: entry }) => (
                <View className={`mb-2 ${cardClass}`}>
                  <View className="flex-row items-center justify-between">
                    <Text className="font-medium tabular-nums">
                      {entry.amount.toFixed(2)}
                      {' '}
                      {entry.currency}
                    </Text>
                    <Text className="text-sm text-muted-foreground">{entry.platform}</Text>
                  </View>
                  {(entry.product_name ?? entry.brand_name) && (
                    <Text className="mt-1 text-sm text-muted-foreground">
                      {[entry.product_name, entry.brand_name].filter(Boolean).join(' · ')}
                    </Text>
                  )}
                </View>
              )}
              stickySectionHeadersEnabled={false}
            />
          )
        : (
            <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
              {listHeader}
              {listFooter}
            </ScrollView>
          )}

      {/* Add income bottom sheet */}
      <Modal
        ref={addIncomeModal.ref}
        snapPoints={['70%']}
        title="Add income"
      >
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }} className="px-4 pb-6">
          <form.Field
            name="amount"
            children={field => (
              <Input
                label="Amount"
                keyboardType="decimal-pad"
                value={String(field.state.value ?? '')}
                onBlur={field.handleBlur}
                onChangeText={field.handleChange}
                error={getFieldError(field)}
                placeholder="0.00"
              />
            )}
          />
          <form.Field
            name="date"
            children={field => (
              <Input
                label="Date"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChangeText={field.handleChange}
                error={getFieldError(field)}
                placeholder="YYYY-MM-DD"
              />
            )}
          />
          <form.Field
            name="platform"
            children={field => (
              <Input
                label="Platform"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChangeText={field.handleChange}
                error={getFieldError(field)}
                placeholder="e.g. TikTok, Amazon"
              />
            )}
          />
          <form.Field
            name="product_name"
            children={field => (
              <Input
                label="Product (optional)"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChangeText={field.handleChange}
                error={getFieldError(field)}
              />
            )}
          />
          <form.Field
            name="brand_name"
            children={field => (
              <Input
                label="Brand (optional)"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChangeText={field.handleChange}
                error={getFieldError(field)}
              />
            )}
          />
          <form.Subscribe
            selector={state => [state.isSubmitting]}
            children={([isSubmitting]) => (
              <Button
                label="Add income"
                variant="secondary"
                size="lg"
                onPress={form.handleSubmit}
                loading={isSubmitting || mutation.isPending}
                className="mt-4 rounded-2xl"
              />
            )}
          />
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
