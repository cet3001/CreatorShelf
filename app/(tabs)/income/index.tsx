import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';
import { listIncomeEntries, createIncomeEntry } from '@/features/income/income-api';
import { IncomeEntry } from '@/types/income';
import { toHumanMessage } from '@/lib/error-message';
import { isSupabaseConfigured } from '@/lib/supabase';

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function sumByDate(entries: IncomeEntry[], fromDate: string, toDate: string): number {
  return entries
    .filter(e => e.date >= fromDate && e.date <= toDate)
    .reduce((acc, e) => acc + e.amount, 0);
}

export default function IncomeScreen() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const configured = isSupabaseConfigured();
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const { data: entries = [], isLoading, error } = useQuery({
    queryKey: ['income', 'entries'],
    queryFn: listIncomeEntries,
    enabled: !!userId,
  });

  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayISO());
  const [platform, setPlatform] = useState<string>('');
  const [productName, setProductName] = useState<string>('');
  const [brandName, setBrandName] = useState<string>('');

  const mutation = useMutation({
    mutationFn: createIncomeEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['income', 'entries'] });
      resetForm();
      setModalVisible(false);
    },
  });

  const resetForm = () => {
    setAmount('');
    setDate(getTodayISO());
    setPlatform('');
    setProductName('');
    setBrandName('');
  };

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

  const sections = useMemo(() => {
    const byDate = new Map<string, IncomeEntry[]>();
    for (const e of entries) {
      const list = byDate.get(e.date) ?? [];
      list.push(e);
      byDate.set(e.date, list);
    }
    return Array.from(byDate.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([dateKey, items]) => ({ title: dateKey, data: items }));
  }, [entries]);

  const handleAddIncome = () => {
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) return;
    if (!date.trim() || !platform.trim()) return;
    mutation.mutate({
      amount: numAmount,
      date,
      currency: 'USD',
      platform: platform.trim(),
      product_name: productName.trim() || null,
      brand_name: brandName.trim() || null,
      note: null,
    });
  };

  if (!configured) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.pageTitle}>Income</Text>
          <Text style={styles.pageSubtitle}>Daily/weekly/monthly income tracking.</Text>
          <View style={styles.infoBanner}>
            <Text style={styles.infoText}>Supabase not configured. Add your env vars to enable income tracking.</Text>
          </View>
        </View>
      </View>
    );
  }

  const listHeader = (
    <View>
      <Text style={styles.pageTitle}>Income</Text>
      <Text style={styles.pageSubtitle}>Daily/weekly/monthly income tracking and bestsellers.</Text>

      <View style={styles.summaryRow}>
        <View style={[styles.card, styles.summaryCard]}>
          <Text style={styles.cardValue}>{summary.today.toFixed(2)}</Text>
          <Text style={styles.cardLabel}>Today</Text>
        </View>
        <View style={[styles.card, styles.summaryCard]}>
          <Text style={styles.cardValue}>{summary.last7.toFixed(2)}</Text>
          <Text style={styles.cardLabel}>Last 7 days</Text>
        </View>
        <View style={[styles.card, styles.summaryCard]}>
          <Text style={styles.cardValue}>{summary.last30.toFixed(2)}</Text>
          <Text style={styles.cardLabel}>Last 30 days</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent entries</Text>
      {isLoading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      )}
      {error && <Text style={styles.errorText}>{toHumanMessage(error)}</Text>}
      {!isLoading && !error && entries.length === 0 && (
        <Text style={styles.emptyText}>No income entries yet. Tap Add income below.</Text>
      )}
    </View>
  );

  const listFooter = (
    <View style={styles.footerWrap}>
      <Pressable
        style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>Add income</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      {!isLoading && !error && sections.length > 0 ? (
        <SectionList
          style={styles.container}
          contentContainerStyle={styles.content}
          sections={sections}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          renderSectionHeader={({ section: { title: sectionTitle } }) => (
            <Text style={styles.dateHeader}>{sectionTitle}</Text>
          )}
          renderItem={({ item: entry }) => (
            <View style={styles.entryCard}>
              <View style={styles.entryRow}>
                <Text style={styles.entryAmount}>
                  {entry.amount.toFixed(2)} {entry.currency}
                </Text>
                <Text style={styles.entryPlatform}>{entry.platform}</Text>
              </View>
              {(entry.product_name ?? entry.brand_name) ? (
                <Text style={styles.entryMeta}>
                  {[entry.product_name, entry.brand_name].filter(Boolean).join(' · ')}
                </Text>
              ) : null}
            </View>
          )}
          stickySectionHeadersEnabled={false}
        />
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          {listHeader}
          {listFooter}
        </ScrollView>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add income</Text>
            <Pressable onPress={() => setModalVisible(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </Pressable>
          </View>

          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Date</Text>
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.label}>Platform</Text>
              <TextInput
                style={styles.input}
                value={platform}
                onChangeText={setPlatform}
                placeholder="e.g. TikTok, Amazon"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.label}>Product (optional)</Text>
              <TextInput
                style={styles.input}
                value={productName}
                onChangeText={setProductName}
                placeholder="Product name"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.label}>Brand (optional)</Text>
              <TextInput
                style={styles.input}
                value={brandName}
                onChangeText={setBrandName}
                placeholder="Brand name"
                placeholderTextColor={Colors.textMuted}
              />

              <Pressable
                style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed, { marginTop: 20 }]}
                onPress={handleAddIncome}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.addButtonText}>Add income</Text>
                )}
              </Pressable>

              {mutation.isError && (
                <Text style={styles.errorText}>{toHumanMessage(mutation.error)}</Text>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
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
  summaryRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    paddingHorizontal: 10,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  cardLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
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
  dateHeader: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginTop: 12,
    marginBottom: 6,
  },
  entryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 12,
    marginBottom: 8,
  },
  entryRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  entryAmount: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  entryPlatform: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  entryMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  footerWrap: {
    marginTop: 16,
    paddingBottom: 16,
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center' as const,
  },
  addButtonPressed: {
    opacity: 0.85,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 16,
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
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  modalClose: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  modalContent: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginBottom: 4,
    marginTop: 12,
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
});
