import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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
import { listCalendarEvents, createCalendarEvent } from '@/features/calendar/calendar-api';
import { builtInEventsForYear, BuiltInEventInstance } from '@/lib/holidays';
import { CalendarEvent } from '@/types/calendar';
import { toHumanMessage } from '@/lib/error-message';
import { isSupabaseConfigured } from '@/lib/supabase';

type CalendarListItem = CalendarEvent | BuiltInEventInstance;

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function groupEventsByDate<T extends { date: string; id: string }>(items: T[]): { title: string; data: T[] }[] {
  const byDate = new Map<string, T[]>();
  for (const e of items) {
    const list = byDate.get(e.date) ?? [];
    list.push(e);
    byDate.set(e.date, list);
  }
  return Array.from(byDate.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => ({ title: date, data }));
}

const EVENT_TYPES = ['seasonal', 'launch', 'other'] as const;

export default function CalendarScreen() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const configured = isSupabaseConfigured();

  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ['calendar', 'events'],
    queryFn: listCalendarEvents,
    enabled: !!userId,
  });

  const mutation = useMutation({
    mutationFn: createCalendarEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] });
      setDate(getTodayISO());
      setTitle('');
      setType('other');
      setProductName('');
      setProductCategory('');
    },
  });

  const [date, setDate] = useState<string>(getTodayISO());
  const [type, setType] = useState<'seasonal' | 'launch' | 'other'>('other');
  const [title, setTitle] = useState<string>('');
  const [productName, setProductName] = useState<string>('');
  const [productCategory, setProductCategory] = useState<string>('');

  const merged = useMemo(() => {
    const year = new Date().getFullYear();
    const builtIn = builtInEventsForYear(year);
    const list: CalendarListItem[] = [...events, ...builtIn];
    list.sort((a, b) => a.date.localeCompare(b.date));
    return list;
  }, [events]);

  const sections = useMemo(() => groupEventsByDate(merged), [merged]);

  const handleAddEvent = () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Title is required.');
      return;
    }
    if (!date.trim()) {
      Alert.alert('Validation', 'Date is required.');
      return;
    }
    mutation.mutate({
      date,
      type,
      title: title.trim(),
      description: null,
      product_name: productName.trim() || null,
      product_category: productCategory.trim() || null,
      seasonal_key: null,
    });
  };

  if (!configured) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.pageTitle}>Calendar</Text>
          <Text style={styles.pageSubtitle}>Content calendar for promos, seasons, and product launches.</Text>
          <View style={styles.infoBanner}>
            <Text style={styles.infoText}>
              Supabase not configured. Add your env vars to enable calendar features.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const addEventForm = (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Add event</Text>

      <Text style={styles.label}>Date</Text>
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={Colors.textMuted}
      />

      <Text style={styles.label}>Type</Text>
      <View style={styles.typeRow}>
        {EVENT_TYPES.map((t) => (
          <Pressable
            key={t}
            style={[styles.typeChip, type === t && styles.typeChipActive]}
            onPress={() => setType(t)}
          >
            <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Event title"
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

      <Text style={styles.label}>Category (optional)</Text>
      <TextInput
        style={styles.input}
        value={productCategory}
        onChangeText={setProductCategory}
        placeholder="Product category"
        placeholderTextColor={Colors.textMuted}
      />

      <Pressable
        style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
        onPress={handleAddEvent}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <ActivityIndicator color={Colors.white} size="small" />
        ) : (
          <Text style={styles.addButtonText}>Add event</Text>
        )}
      </Pressable>

      {mutation.isError && (
        <Text style={styles.errorText}>{toHumanMessage(mutation.error)}</Text>
      )}
    </View>
  );

  const listHeader = (
    <View>
      <Text style={styles.pageTitle}>Calendar</Text>
      <Text style={styles.pageSubtitle}>Content calendar for promos, seasons, and product launches.</Text>
      <Text style={styles.sectionTitle}>Upcoming events</Text>
      {isLoading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      )}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{toHumanMessage(error)}</Text>
        </View>
      )}
      {!isLoading && !error && events.length === 0 && (
        <Text style={styles.emptyText}>No personal events yet. Built-in holidays are shown below.</Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      {!isLoading && !error && sections.length > 0 ? (
        <SectionList
          style={styles.container}
          contentContainerStyle={styles.content}
          sections={sections}
          keyExtractor={(item: CalendarListItem) => item.id}
          removeClippedSubviews
          initialNumToRender={10}
          ListHeaderComponent={listHeader}
          ListFooterComponent={addEventForm}
          renderSectionHeader={({ section: { title: sectionTitle } }) => (
            <Text style={styles.dateHeader}>{sectionTitle}</Text>
          )}
          renderItem={({ item: event }) => {
            const isBuiltIn = 'isBuiltIn' in event && event.isBuiltIn;
            return (
              <Pressable
                style={[styles.eventCard, isBuiltIn && styles.eventCardBuiltIn]}
                onPress={isBuiltIn ? () => Alert.alert(event.title, `Date: ${event.date}`) : undefined}
              >
                <View style={styles.eventRow}>
                  {isBuiltIn && <Text style={styles.builtInIcon}>📅</Text>}
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{event.type}</Text>
                  </View>
                </View>
                {!isBuiltIn && 'product_name' in event && (event.product_name ?? event.product_category) ? (
                  <Text style={styles.eventMeta}>
                    {[event.product_name, event.product_category].filter(Boolean).join(' · ')}
                  </Text>
                ) : null}
              </Pressable>
            );
          }}
          stickySectionHeadersEnabled={false}
        />
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          {listHeader}
          {addEventForm}
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
  dateHeader: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginTop: 12,
    marginBottom: 6,
  },
  eventCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 12,
    marginBottom: 8,
  },
  eventCardBuiltIn: {
    backgroundColor: Colors.surfaceLight,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  eventRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  builtInIcon: {
    fontSize: 14,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
    flex: 1,
  },
  typeBadge: {
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
  eventMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
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
  typeRow: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 4,
  },
  typeChip: {
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.inputBg,
  },
  typeChipActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
  },
  typeChipText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  typeChipTextActive: {
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
  errorBanner: {
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    color: Colors.danger,
    marginTop: 8,
  },
});
