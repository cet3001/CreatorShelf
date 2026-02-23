import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/colors';
import { useAuthStore, getCurrentUserId } from '@/store/auth-store';
import { listContracts, createContract, uploadContractAttachments, updateContractAttachmentUrls } from '@/features/contracts/contracts-api';
import { toHumanMessage } from '@/lib/error-message';
import { isSupabaseConfigured } from '@/lib/supabase';

const CONTRACT_STATUSES = ['draft', 'negotiating', 'signed', 'content_delivered', 'paid'] as const;

type AttachmentFile = { id: string; uri: string; name: string };

export default function ContractsScreen() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const configured = isSupabaseConfigured();

  const { data: contracts = [], isLoading, error } = useQuery({
    queryKey: ['contracts', 'list'],
    queryFn: listContracts,
    enabled: !!userId,
  });

  const [brandName, setBrandName] = useState<string>('');
  const [deliverables, setDeliverables] = useState<string>('');
  const [platform, setPlatform] = useState<string>('');
  const [feeAmount, setFeeAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>('USD');
  const [status, setStatus] = useState<typeof CONTRACT_STATUSES[number]>('negotiating');
  const [dueDate, setDueDate] = useState<string>('');
  const [paymentDueDate, setPaymentDueDate] = useState<string>('');
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);

  const mutation = useMutation({
    mutationFn: async (input: Parameters<typeof createContract>[0]) => {
      const contract = await createContract(input);
      const currentUserId = getCurrentUserId();
      if (currentUserId && attachments.length > 0) {
        const paths = await uploadContractAttachments(currentUserId, contract.id, attachments);
        await updateContractAttachmentUrls(contract.id, paths);
      }
      return contract;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts', 'list'] });
      setBrandName('');
      setDeliverables('');
      setPlatform('');
      setFeeAmount('');
      setCurrency('USD');
      setStatus('negotiating');
      setDueDate('');
      setPaymentDueDate('');
      setAttachments([]);
    },
  });

  const handleAdd = () => {
    if (!brandName.trim()) {
      Alert.alert('Validation', 'Brand name is required.');
      return;
    }
    const feeNum = feeAmount ? Number(feeAmount) : null;
    mutation.mutate({
      brand_name: brandName.trim(),
      contact_name: null,
      contact_email: null,
      deliverables: deliverables.trim() || null,
      platform: platform.trim() || null,
      fee_amount: feeNum && isFinite(feeNum) ? feeNum : null,
      currency: currency.trim() || null,
      status,
      start_date: null,
      due_date: dueDate.trim() || null,
      payment_due_date: paymentDueDate.trim() || null,
      usage_rights_notes: null,
      attachment_urls: [],
    });
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (result.canceled) return;
    setAttachments(a => [...a, { id: `${result.assets[0].uri}-${Date.now()}`, uri: result.assets[0].uri, name: result.assets[0].name ?? 'file' }]);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true });
    if (result.canceled) return;
    const newFiles = result.assets.map(a => ({ id: `${a.uri}-${Date.now()}-${Math.random()}`, uri: a.uri, name: a.fileName ?? `image-${Date.now()}.jpg` }));
    setAttachments(prev => [...prev, ...newFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(a => a.filter((_, i) => i !== index));
  };

  if (!configured) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.pageTitle}>Contracts</Text>
          <Text style={styles.pageSubtitle}>Contracts, deliverables, and payment terms.</Text>
          <View style={styles.infoBanner}>
            <Text style={styles.infoText}>Supabase not configured. Add your env vars to enable contracts.</Text>
          </View>
        </View>
      </View>
    );
  }

  const listHeader = (
    <View>
      <Text style={styles.pageTitle}>Contracts</Text>
      <Text style={styles.pageSubtitle}>Contracts, deliverables, and payment terms.</Text>
      <Text style={styles.sectionTitle}>Contracts</Text>
      {isLoading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      )}
      {error && <Text style={styles.errorText}>{toHumanMessage(error)}</Text>}
      {!isLoading && !error && contracts.length === 0 && (
        <Text style={styles.emptyText}>No contracts yet. Add one below.</Text>
      )}
    </View>
  );

  const listFooter = (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Add contract</Text>

      <Text style={styles.label}>Brand name</Text>
      <TextInput style={styles.input} value={brandName} onChangeText={setBrandName} placeholder="Brand name" placeholderTextColor={Colors.textMuted} />

      <Text style={styles.label}>Deliverables / notes</Text>
      <TextInput style={[styles.input, styles.multiline]} value={deliverables} onChangeText={setDeliverables} placeholder="Paste or type deliverables..." placeholderTextColor={Colors.textMuted} multiline numberOfLines={4} textAlignVertical="top" />

      <Text style={styles.label}>Attachments</Text>
      <View style={styles.attachRow}>
        <Pressable style={styles.attachBtn} onPress={pickDocument}>
          <Text style={styles.attachBtnText}>Pick file</Text>
        </Pressable>
        <Pressable style={styles.attachBtn} onPress={pickImage}>
          <Text style={styles.attachBtnText}>Pick image</Text>
        </Pressable>
      </View>
      {attachments.length > 0 && (
        <View style={styles.attachList}>
          {attachments.map((f, i) => (
            <View key={f.id} style={styles.attachItem}>
              <Text style={styles.attachName} numberOfLines={1}>{f.name}</Text>
              <Pressable onPress={() => removeAttachment(i)} hitSlop={8}>
                <Text style={styles.attachRemove}>Remove</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.label}>Platform (optional)</Text>
      <TextInput style={styles.input} value={platform} onChangeText={setPlatform} placeholder="e.g. TikTok" placeholderTextColor={Colors.textMuted} />

      <Text style={styles.label}>Fee amount (optional)</Text>
      <TextInput style={styles.input} value={feeAmount} onChangeText={setFeeAmount} placeholder="0.00" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" />

      <Text style={styles.label}>Currency (optional)</Text>
      <TextInput style={styles.input} value={currency} onChangeText={setCurrency} placeholder="USD" placeholderTextColor={Colors.textMuted} />

      <Text style={styles.label}>Status</Text>
      <View style={styles.statusRow}>
        {CONTRACT_STATUSES.map((s) => (
          <Pressable key={s} style={[styles.statusChip, status === s && styles.statusChipActive]} onPress={() => setStatus(s)}>
            <Text style={[styles.statusChipText, status === s && styles.statusChipTextActive]}>
              {s.replace(/_/g, ' ')}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Due date (optional)</Text>
      <TextInput style={styles.input} value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textMuted} />

      <Text style={styles.label}>Payment due date (optional)</Text>
      <TextInput style={styles.input} value={paymentDueDate} onChangeText={setPaymentDueDate} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textMuted} />

      <Pressable style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]} onPress={handleAdd} disabled={mutation.isPending}>
        {mutation.isPending ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={styles.addButtonText}>Add contract</Text>}
      </Pressable>

      {mutation.isError && <Text style={styles.errorText}>{toHumanMessage(mutation.error)}</Text>}
    </View>
  );

  const renderItem = ({ item: c }: { item: typeof contracts[number] }) => {
    const isPaid = c.status === 'paid';
    return (
      <View style={styles.contractCard}>
        <View style={styles.contractRow}>
          <Text style={styles.contractBrand}>{c.brand_name}</Text>
          <View style={[styles.contractBadge, isPaid && styles.contractBadgePaid]}>
            <Text style={[styles.contractBadgeText, isPaid && styles.contractBadgeTextPaid]}>
              {c.status.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>
        {(c.due_date || c.fee_amount != null) && (
          <View style={styles.contractMeta}>
            {c.due_date ? <Text style={styles.contractMetaText}>Due: {c.due_date}</Text> : null}
            {c.fee_amount != null ? (
              <Text style={styles.contractMetaText}>{c.fee_amount.toFixed(2)} {c.currency ?? 'USD'}</Text>
            ) : null}
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={100}>
      {!isLoading && !error && contracts.length > 0 ? (
        <FlatList
          style={styles.container}
          contentContainerStyle={styles.content}
          data={contracts}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          renderItem={renderItem}
        />
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          {listHeader}
          {listFooter}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  loadingWrap: {
    paddingVertical: 32,
    alignItems: 'center' as const,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  contractCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 12,
    marginBottom: 8,
  },
  contractRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  contractBrand: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  contractBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
  },
  contractBadgePaid: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  contractBadgeText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
  contractBadgeTextPaid: {
    color: Colors.success,
  },
  contractMeta: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
    marginTop: 6,
  },
  contractMetaText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  formSection: {
    marginTop: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginBottom: 4,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 10,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: Colors.text,
  },
  multiline: {
    minHeight: 80,
    paddingTop: 12,
  },
  attachRow: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 4,
  },
  attachBtn: {
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.inputBg,
  },
  attachBtnText: {
    fontSize: 13,
    color: Colors.text,
  },
  attachList: {
    marginTop: 8,
    gap: 4,
  },
  attachItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  attachName: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  attachRemove: {
    fontSize: 12,
    color: Colors.danger,
    marginLeft: 8,
  },
  statusRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: 4,
  },
  statusChip: {
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: Colors.inputBg,
  },
  statusChipActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
  },
  statusChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statusChipTextActive: {
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center' as const,
    marginTop: 16,
  },
  addButtonPressed: {
    opacity: 0.85,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  infoBanner: {
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 12,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: 13,
    color: Colors.danger,
    marginTop: 8,
  },
});
