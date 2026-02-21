import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';

import * as z from 'zod';
import {
  Button,
  EmptyState,
  ListErrorBanner,
  Select,
  SupabaseNotConfiguredBanner,
  Text,
  View,
} from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { Input } from '@/components/ui/input';
import { signOut } from '@/features/auth/use-auth-store';
import {
  SupabaseNotConfiguredError,
  useCalendarEventsQuery,
  useCreateCalendarEventMutation,
} from '@/features/calendar/calendar.api';
import { AuthRequiredError } from '@/lib/auth';
import { toHumanMessage } from '@/lib/error-message';
import { isSupabaseConfigured } from '@/lib/supabase';

const addEventSchemaOnChange = z.object({
  date: z.string(),
  type: z.string(),
  title: z.string(),
  product_name: z.string().optional(),
  product_category: z.string().optional(),
});

const addEventSchemaOnSubmit = z.object({
  date: z.string().min(1, 'Date is required'),
  type: z.enum(['seasonal', 'launch', 'other']),
  title: z.string().min(1, 'Title is required'),
  product_name: z.string().optional(),
  product_category: z.string().optional(),
});

const CALENDAR_TYPE_OPTIONS = [
  { label: 'Seasonal', value: 'seasonal' },
  { label: 'Launch', value: 'launch' },
  { label: 'Other', value: 'other' },
];

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function groupEventsByDate(events: { id: string; date: string; title: string; type: string; product_name: string | null; product_category: string | null }[]) {
  const byDate = new Map<string, typeof events>();
  for (const e of events) {
    const list = byDate.get(e.date) ?? [];
    list.push(e);
    byDate.set(e.date, list);
  }
  return Array.from(byDate.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([date, items]) => ({ date, items }));
}

const CARD_CLASS = 'rounded-2xl border border-neutral-200/80 bg-white/95 p-3 dark:border-neutral-600/50 dark:bg-neutral-800/95';

/* eslint-disable max-lines-per-function -- screen: list + form; extract subcomponents if needed */
export default function CalendarScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const configured = isSupabaseConfigured();
  const { data: events = [], isLoading, error } = useCalendarEventsQuery();
  const mutation = useCreateCalendarEventMutation();

  const form = useForm({
    defaultValues: {
      date: getTodayISO(),
      type: 'other' as 'seasonal' | 'launch' | 'other',
      title: '',
      product_name: '',
      product_category: '',
    },
    validators: {
      onChange: addEventSchemaOnChange as any,
      onSubmit: addEventSchemaOnSubmit as any,
    },
    onSubmit: async ({ value }) => {
      try {
        await mutation.mutateAsync({
          date: value.date,
          type: value.type as 'seasonal' | 'launch' | 'other',
          title: value.title.trim(),
          description: null,
          product_name: value.product_name?.trim() || null,
          product_category: value.product_category?.trim() || null,
          seasonal_key: null,
        });
        form.reset();
        await queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] });
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

  const grouped = useMemo(() => groupEventsByDate(events), [events]);

  if (!configured) {
    return (
      <View className="flex-1 p-6">
        <Text className="mb-2 text-2xl font-bold">Calendar</Text>
        <Text className="mb-4 text-muted-foreground">
          Content calendar for promos, seasons, and product launches.
        </Text>
        <SupabaseNotConfiguredBanner hint="Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file, then run the SQL in calendar.api.ts to create the calendar_events table." />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      keyboardVerticalOffset={80}
    >
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
        <Text className="mb-2 text-2xl font-bold">Calendar</Text>
        <Text className="mb-4 text-muted-foreground">
          Content calendar for promos, seasons, and product launches.
        </Text>

        <View className="mb-6">
          <Text className="mb-2 text-lg font-semibold">Upcoming events</Text>
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
          {!isLoading && !error && events.length === 0 && (
            <EmptyState message="No upcoming events. Add one below." />
          )}
          {!isLoading && !error && grouped.length > 0 && (
            <View className="gap-3">
              {grouped.map(({ date, items }) => (
                <View key={date}>
                  <Text className="mb-2 text-sm font-medium text-muted-foreground">{date}</Text>
                  <View className="gap-2">
                    {items.map(event => (
                      <View key={event.id} className={CARD_CLASS}>
                        <View className="flex-row flex-wrap items-center justify-between gap-2">
                          <Text className="font-medium">{event.title}</Text>
                          <View className="rounded-full bg-primary-100 px-2 py-0.5 dark:bg-primary-900/50">
                            <Text className="text-xs font-medium text-primary-700 dark:text-primary-300">
                              {event.type}
                            </Text>
                          </View>
                        </View>
                        {(event.product_name ?? event.product_category) && (
                          <Text className="mt-1 text-sm text-muted-foreground">
                            {[event.product_name, event.product_category].filter(Boolean).join(' · ')}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-lg font-semibold">Add event</Text>
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
            name="type"
            children={field => (
              <Select
                label="Type"
                options={CALENDAR_TYPE_OPTIONS}
                value={field.state.value}
                onSelect={v => field.handleChange(() => String(v) as 'seasonal' | 'launch' | 'other')}
                error={getFieldError(field)}
                placeholder="Select type"
              />
            )}
          />
          <form.Field
            name="title"
            children={field => (
              <Input
                label="Title"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChangeText={field.handleChange}
                error={getFieldError(field)}
                placeholder="Event title"
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
            name="product_category"
            children={field => (
              <Input
                label="Product category (optional)"
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
                label="Add event"
                variant="secondary"
                onPress={form.handleSubmit}
                loading={isSubmitting || mutation.isPending}
              />
            )}
          />
          {mutation.isError && !(mutation.error instanceof SupabaseNotConfiguredError) && !(mutation.error instanceof AuthRequiredError) && (
            <Text className="mt-2 text-sm text-danger-600">
              {toHumanMessage(mutation.error)}
            </Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
