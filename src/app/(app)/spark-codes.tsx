import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
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
  useCreateSparkCodeMutation,
  useSparkCodesQuery,
} from '@/features/spark-codes/spark-codes.api';
import { AuthRequiredError } from '@/lib/auth';
import { toHumanMessage } from '@/lib/error-message';
import { isSupabaseConfigured } from '@/lib/supabase';

const addSparkCodeSchemaOnChange = z.object({
  code: z.string(),
  video_url: z.string().optional(),
  brand_name: z.string().optional(),
  status: z.string(),
  expires_at: z.string().optional(),
  note: z.string().optional(),
});

const addSparkCodeSchemaOnSubmit = z.object({
  code: z.string().min(1, 'Code is required'),
  video_url: z.string().optional(),
  brand_name: z.string().optional(),
  status: z.enum(['draft', 'sent_to_brand', 'active', 'expired']),
  expires_at: z.string().optional(),
  note: z.string().optional(),
});

const SPARK_STATUS_OPTIONS = [
  { label: 'Draft', value: 'draft' },
  { label: 'Sent to brand', value: 'sent_to_brand' },
  { label: 'Active', value: 'active' },
  { label: 'Expired', value: 'expired' },
];

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt)
    return false;
  return new Date(expiresAt) < new Date();
}

function truncateUrl(url: string | null, maxLen = 40): string {
  if (!url)
    return '';
  return url.length <= maxLen ? url : `${url.slice(0, maxLen)}…`;
}

/* eslint-disable max-lines-per-function -- screen: list + form; extract subcomponents if needed */
export default function SparkCodesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const configured = isSupabaseConfigured();
  const { data: codes = [], isLoading, error } = useSparkCodesQuery();
  const mutation = useCreateSparkCodeMutation();

  const form = useForm({
    defaultValues: {
      code: '',
      video_url: '',
      brand_name: '',
      status: 'draft' as 'draft' | 'sent_to_brand' | 'active' | 'expired',
      expires_at: '',
      note: '',
    },
    validators: {
      onChange: addSparkCodeSchemaOnChange as any,
      onSubmit: addSparkCodeSchemaOnSubmit as any,
    },
    onSubmit: async ({ value }) => {
      try {
        await mutation.mutateAsync({
          code: value.code.trim(),
          video_url: value.video_url?.trim() || null,
          brand_name: value.brand_name?.trim() || null,
          platform: null,
          status: value.status as 'draft' | 'sent_to_brand' | 'active' | 'expired',
          expires_at: value.expires_at?.trim() || null,
          note: value.note?.trim() || null,
        });
        form.reset();
        await queryClient.invalidateQueries({ queryKey: ['spark-codes', 'list'] });
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

  if (!configured) {
    return (
      <View className="flex-1 p-6">
        <Text className="mb-2 text-2xl font-bold">SparkCodes</Text>
        <Text className="mb-4 text-muted-foreground">
          Track Spark codes, video links, and brand status.
        </Text>
        <SupabaseNotConfiguredBanner hint="Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file, then run the SQL in spark-codes.api.ts to create the spark_codes table." />
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
        <Text className="mb-2 text-2xl font-bold">SparkCodes</Text>
        <Text className="mb-4 text-muted-foreground">
          Track Spark codes, video links, and brand status.
        </Text>

        <View className="mb-6">
          <Text className="mb-2 text-lg font-semibold">Spark codes</Text>
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
          {!isLoading && !error && codes.length === 0 && (
            <EmptyState message="No Spark codes yet. Add one below." />
          )}
          {!isLoading && !error && codes.length > 0 && (
            <View className="gap-2">
              {codes.map((item) => {
                const expired = item.expires_at ? isExpired(item.expires_at) : false;
                const isActive = item.status === 'active' && !expired;
                return (
                  <View
                    key={item.id}
                    className="rounded-2xl border border-neutral-200/80 bg-white/95 p-3 dark:border-neutral-600/50 dark:bg-neutral-800/95"
                  >
                    <View className="flex-row flex-wrap items-center justify-between gap-2">
                      <Text className="font-mono text-base font-medium" selectable>
                        {item.code}
                      </Text>
                      <View
                        className={`rounded-full px-2 py-0.5 ${isActive ? 'bg-success-100 dark:bg-success-900/50' : expired ? 'bg-warning-100 dark:bg-warning-900/50' : 'bg-neutral-100 dark:bg-neutral-700/50'}`}
                      >
                        <Text
                          className={`text-xs font-medium ${isActive ? 'text-success-700 dark:text-success-300' : expired ? 'text-warning-700 dark:text-warning-300' : 'text-muted-foreground'}`}
                        >
                          {expired ? 'Expired' : item.status}
                        </Text>
                      </View>
                    </View>
                    {item.brand_name && (
                      <Text className="mt-1 text-sm text-muted-foreground">
                        {item.brand_name}
                      </Text>
                    )}
                    {item.video_url && (
                      <Text className="mt-1 text-xs text-muted-foreground" numberOfLines={1}>
                        {truncateUrl(item.video_url)}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View className="mb-4">
          <Text className="mb-2 text-lg font-semibold">Add Spark code</Text>
          <form.Field
            name="code"
            children={field => (
              <Input
                label="Code"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChangeText={field.handleChange}
                error={getFieldError(field)}
                placeholder="Spark code"
              />
            )}
          />
          <form.Field
            name="video_url"
            children={field => (
              <Input
                label="Video URL (optional)"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChangeText={field.handleChange}
                error={getFieldError(field)}
                placeholder="https://..."
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
          <form.Field
            name="status"
            children={field => (
              <Select
                label="Status"
                options={SPARK_STATUS_OPTIONS}
                value={field.state.value}
                onSelect={v => field.handleChange(() => String(v) as 'draft' | 'sent_to_brand' | 'active' | 'expired')}
                error={getFieldError(field)}
                placeholder="Select status"
              />
            )}
          />
          <form.Field
            name="expires_at"
            children={field => (
              <Input
                label="Expires at (optional)"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChangeText={field.handleChange}
                error={getFieldError(field)}
                placeholder="YYYY-MM-DD or ISO"
              />
            )}
          />
          <form.Field
            name="note"
            children={field => (
              <Input
                label="Note (optional)"
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
                label="Add Spark code"
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
