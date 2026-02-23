import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';
import { getProfileByUserId } from '@/features/profile/profile-api';
import { listIncomeEntries } from '@/features/income/income-api';
import { listCalendarEvents } from '@/features/calendar/calendar-api';
import { listSparkCodes } from '@/features/spark-codes/spark-codes-api';
import { listContracts } from '@/features/contracts/contracts-api';
import { IncomeEntry } from '@/types/income';

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function sumByDate(entries: IncomeEntry[], fromDate: string, toDate: string): number {
  return entries
    .filter(e => e.date >= fromDate && e.date <= toDate)
    .reduce((sum, e) => sum + e.amount, 0);
}

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const userId = user?.id ?? null;

  const { data: profile } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => userId ? getProfileByUserId(userId) : null,
    enabled: !!userId,
  });

  const { data: incomeEntries = [], isLoading: incomeLoading } = useQuery({
    queryKey: ['income', 'entries'],
    queryFn: listIncomeEntries,
    enabled: !!userId,
  });

  const { data: calendarEvents = [], isLoading: calendarLoading } = useQuery({
    queryKey: ['calendar', 'events'],
    queryFn: listCalendarEvents,
    enabled: !!userId,
  });

  const { data: sparkCodes = [], isLoading: sparkLoading } = useQuery({
    queryKey: ['spark-codes', 'list'],
    queryFn: listSparkCodes,
    enabled: !!userId,
  });

  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ['contracts', 'list'],
    queryFn: listContracts,
    enabled: !!userId,
  });

  const isLoading = incomeLoading || calendarLoading || sparkLoading || contractsLoading;
  const activeSparkCount = sparkCodes.filter(c => c.status === 'active').length;
  const openContractsCount = contracts.filter(c => c.status !== 'paid').length;
  const greeting = profile?.first_name
    ? `Welcome back, ${profile.first_name}.`
    : 'Welcome back.';

  const incomeSummary = useMemo(() => {
    const today = getTodayISO();
    const d = new Date();
    d.setDate(d.getDate() - 7);
    const sevenDaysAgo = d.toISOString().slice(0, 10);
    const d30 = new Date();
    d30.setDate(d30.getDate() - 30);
    const thirtyDaysAgo = d30.toISOString().slice(0, 10);
    return {
      today: sumByDate(incomeEntries, today, today),
      last7: sumByDate(incomeEntries, sevenDaysAgo, today),
      last30: sumByDate(incomeEntries, thirtyDaysAgo, today),
    };
  }, [incomeEntries]);

  const showSignInMessage = !user && status !== 'loading';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      scrollEventThrottle={16}
    >
      <Text style={styles.greeting}>{greeting}</Text>
      <Text style={styles.subtitle}>
        Today's income, upcoming promos, and deadlines.
      </Text>

      {showSignInMessage && (
        <Text style={styles.hintText}>
          Please sign in to view your CreatorShelf dashboard.
        </Text>
      )}

      {!showSignInMessage && isLoading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      )}

      {!showSignInMessage && !isLoading && (
        <View style={styles.cardsContainer}>
          {incomeEntries.length > 0 && (
            <View style={styles.summaryRow}>
              <View style={[styles.card, styles.summaryCard]}>
                <Text style={styles.cardValue}>{incomeSummary.today.toFixed(2)}</Text>
                <Text style={styles.cardLabel}>Today (USD)</Text>
              </View>
              <View style={[styles.card, styles.summaryCard]}>
                <Text style={styles.cardValue}>{incomeSummary.last7.toFixed(2)}</Text>
                <Text style={styles.cardLabel}>Last 7 days</Text>
              </View>
              <View style={[styles.card, styles.summaryCard]}>
                <Text style={styles.cardValue}>{incomeSummary.last30.toFixed(2)}</Text>
                <Text style={styles.cardLabel}>Last 30 days</Text>
              </View>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardValue}>{incomeEntries.length}</Text>
            <Text style={styles.cardLabel}>Income entries</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardValue}>{calendarEvents.length}</Text>
            <Text style={styles.cardLabel}>Upcoming calendar events</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardValue}>{activeSparkCount}</Text>
            <Text style={styles.cardLabel}>Active Spark codes</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardValue}>{openContractsCount}</Text>
            <Text style={styles.cardLabel}>Open contracts</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  hintText: {
    fontSize: 15,
    color: Colors.textSecondary,
    paddingVertical: 16,
  },
  loadingWrap: {
    paddingVertical: 32,
    alignItems: 'center' as const,
  },
  cardsContainer: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row' as const,
    gap: 10,
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
    padding: 16,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '600' as const,
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  cardLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
