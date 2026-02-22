import { useForm } from '@tanstack/react-form';
import { useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Pressable,
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
import { getCurrentUserId, signOut } from '@/features/auth/use-auth-store';
import {
  SupabaseNotConfiguredError,
  updateContractAttachmentUrls,
  uploadContractAttachments,
  useContractsQuery,
  useCreateContractMutation,
} from '@/features/contracts/contracts.api';
import { AuthRequiredError } from '@/lib/auth';
import { toHumanMessage } from '@/lib/error-message';
import { isSupabaseConfigured } from '@/lib/supabase';

const addContractSchemaOnChange = z.object({
  brand_name: z.string(),
  deliverables: z.string().optional(),
  platform: z.string().optional(),
  fee_amount: z.union([z.literal(''), z.string()]).optional(),
  currency: z.string().optional(),
  status: z.string(),
  due_date: z.string().optional(),
  payment_due_date: z.string().optional(),
});

const addContractSchemaOnSubmit = z.object({
  brand_name: z.string().min(1, 'Brand name is required'),
  deliverables: z.string().optional(),
  platform: z.string().optional(),
  fee_amount: z.union([z.literal(''), z.string()]).optional(),
  currency: z.string().optional(),
  status: z.enum(['draft', 'negotiating', 'signed', 'content_delivered', 'paid']),
  due_date: z.string().optional(),
  payment_due_date: z.string().optional(),
});

const CONTRACT_STATUS_OPTIONS = [
  { label: 'Draft', value: 'draft' },
  { label: 'Negotiating', value: 'negotiating' },
  { label: 'Signed', value: 'signed' },
  { label: 'Content delivered', value: 'content_delivered' },
  { label: 'Paid', value: 'paid' },
];

/* eslint-disable max-lines-per-function -- screen: list + form; extract subcomponents if needed */
export default function ContractsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const configured = isSupabaseConfigured();
  const { data: contracts = [], isLoading, error } = useContractsQuery();
  const mutation = useCreateContractMutation();

  const [attachments, setAttachments] = React.useState<{ id: string; uri: string; name: string }[]>([]);

  const form = useForm({
    defaultValues: {
      brand_name: '',
      deliverables: '',
      platform: '',
      fee_amount: '',
      currency: 'USD',
      status: 'negotiating' as 'draft' | 'negotiating' | 'signed' | 'content_delivered' | 'paid',
      due_date: '',
      payment_due_date: '',
    },
    validators: {
      onChange: addContractSchemaOnChange as any,
      onSubmit: addContractSchemaOnSubmit as any,
    },
    onSubmit: async ({ value }) => {
      try {
        const feeAmount = value.fee_amount
          ? Number(value.fee_amount)
          : null;
        const contract = await mutation.mutateAsync({
          brand_name: value.brand_name.trim(),
          contact_name: null,
          contact_email: null,
          deliverables: value.deliverables?.trim() || null,
          platform: value.platform?.trim() || null,
          fee_amount: Number.isFinite(feeAmount) ? feeAmount : null,
          currency: value.currency?.trim() || null,
          status: value.status as 'draft' | 'negotiating' | 'signed' | 'content_delivered' | 'paid',
          start_date: null,
          due_date: value.due_date?.trim() || null,
          payment_due_date: value.payment_due_date?.trim() || null,
          usage_rights_notes: null,
          attachment_urls: [],
        });
        const userId = getCurrentUserId();
        if (userId && attachments.length > 0) {
          const paths = await uploadContractAttachments(userId, contract.id, attachments);
          await updateContractAttachmentUrls(contract.id, paths);
        }
        form.reset();
        setAttachments([]);
        await queryClient.invalidateQueries({ queryKey: ['contracts', 'list'] });
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
        <Text className="mb-2 text-2xl font-bold">Contracts</Text>
        <Text className="mb-4 text-muted-foreground">
          Contracts, deliverables, and payment terms.
        </Text>
        <SupabaseNotConfiguredBanner hint="Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file, then run the SQL in contracts.api.ts to create the contracts table." />
      </View>
    );
  }

  const listHeader = (
    <View className="mb-6">
      <Text className="mb-2 text-2xl font-bold">Contracts</Text>
      <Text className="mb-4 text-muted-foreground">
        Contracts, deliverables, and payment terms.
      </Text>
      <Text className="mb-2 text-lg font-semibold">Contracts</Text>
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
      {!isLoading && !error && contracts.length === 0 && (
        <EmptyState message="No contracts yet. Add one below." />
      )}
    </View>
  );

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (result.canceled)
      return;

    setAttachments(a => [...a, { id: `${result.assets[0].uri}-${Date.now()}`, uri: result.assets[0].uri, name: result.assets[0].name ?? 'file' }]);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, allowsMultipleSelection: true });
    if (result.canceled)
      return;

    const newFiles = result.assets.map(a => ({ id: `${a.uri}-${Date.now()}-${Math.random()}`, uri: a.uri, name: a.fileName ?? `image-${Date.now()}.jpg` }));
    setAttachments(prev => [...prev, ...newFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(a => a.filter((_, i) => i !== index));
  };

  const listFooter = (
    <View className="mb-4">
      <Text className="mb-2 text-lg font-semibold">Add contract</Text>
      <form.Field
        name="brand_name"
        children={field => (
          <Input
            label="Brand name"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            error={getFieldError(field)}
            placeholder="Brand name"
          />
        )}
      />
      <form.Field
        name="deliverables"
        children={field => (
          <Input
            label="Deliverables / notes"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            error={getFieldError(field)}
            placeholder="Paste or type deliverables..."
            multiline
            numberOfLines={4}
          />
        )}
      />
      <View className="mb-2">
        <Text className="mb-1 text-sm font-medium text-muted-foreground">Attachments</Text>
        <View className="flex-row gap-2">
          <Button label="Pick file" variant="outline" size="default" onPress={pickDocument} />
          <Button label="Pick image" variant="outline" size="default" onPress={pickImage} />
        </View>
        {attachments.length > 0 && (
          <View className="mt-2 gap-1">
            {attachments.map((f, i) => (
              <View key={f.id} className="flex-row items-center justify-between rounded-sm border border-neutral-200 bg-neutral-50 px-2 py-1 dark:border-neutral-600 dark:bg-neutral-800">
                <Text className="flex-1 text-xs text-muted-foreground" numberOfLines={1}>{f.name}</Text>
                <Pressable onPress={() => removeAttachment(i)} hitSlop={8}>
                  <Text className="text-xs text-danger-600">Remove</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>
      <form.Field
        name="platform"
        children={field => (
          <Input
            label="Platform (optional)"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            error={getFieldError(field)}
          />
        )}
      />
      <form.Field
        name="fee_amount"
        children={field => (
          <Input
            label="Fee amount (optional)"
            keyboardType="decimal-pad"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            error={getFieldError(field)}
            placeholder="0.00"
          />
        )}
      />
      <form.Field
        name="currency"
        children={field => (
          <Input
            label="Currency (optional)"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            error={getFieldError(field)}
            placeholder="USD"
          />
        )}
      />
      <form.Field
        name="status"
        children={field => (
          <Select
            label="Status"
            options={CONTRACT_STATUS_OPTIONS}
            value={field.state.value}
            onSelect={v => field.handleChange(() => String(v) as 'draft' | 'negotiating' | 'signed' | 'content_delivered' | 'paid')}
            error={getFieldError(field)}
            placeholder="Select status"
          />
        )}
      />
      <form.Field
        name="due_date"
        children={field => (
          <Input
            label="Due date (optional)"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            error={getFieldError(field)}
            placeholder="YYYY-MM-DD"
          />
        )}
      />
      <form.Field
        name="payment_due_date"
        children={field => (
          <Input
            label="Payment due date (optional)"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            error={getFieldError(field)}
            placeholder="YYYY-MM-DD"
          />
        )}
      />
      <form.Subscribe
        selector={state => [state.isSubmitting]}
        children={([isSubmitting]) => (
          <Button
            label="Add contract"
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
  );

  const renderItem = ({ item: c }: { item: typeof contracts[number] }) => {
    const isPaid = c.status === 'paid';
    return (
      <View className="mb-2 rounded-2xl border border-neutral-200/80 bg-white/95 p-3 dark:border-neutral-600/50 dark:bg-neutral-800/95">
        <View className="flex-row flex-wrap items-center justify-between gap-2">
          <Text className="font-medium">{c.brand_name}</Text>
          <View
            className={`rounded-full px-2 py-0.5 ${isPaid ? 'bg-success-100 dark:bg-success-900/50' : 'bg-primary-100 dark:bg-primary-900/50'}`}
          >
            <Text
              className={`text-xs font-medium ${isPaid ? 'text-success-700 dark:text-success-300' : 'text-primary-700 dark:text-primary-300'}`}
            >
              {c.status}
            </Text>
          </View>
        </View>
        {(c.due_date ?? c.fee_amount != null) && (
          <View className="mt-1 flex-row flex-wrap gap-3">
            {c.due_date && (
              <Text className="text-sm text-muted-foreground">
                Due:
                {' '}
                {c.due_date}
              </Text>
            )}
            {c.fee_amount != null && (
              <Text className="text-sm text-muted-foreground tabular-nums">
                {c.fee_amount.toFixed(2)}
                {' '}
                {c.currency ?? 'USD'}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      keyboardVerticalOffset={80}
    >
      {!isLoading && !error && contracts.length > 0
        ? (
            <FlatList
              className="flex-1"
              contentContainerStyle={{ padding: 24 }}
              data={contracts}
              keyExtractor={item => item.id}
              removeClippedSubviews
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              ListHeaderComponent={listHeader}
              ListFooterComponent={listFooter}
              renderItem={renderItem}
            />
          )
        : (
            <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
              {listHeader}
              {listFooter}
            </ScrollView>
          )}
    </KeyboardAvoidingView>
  );
}
