import type { IncomeEntry } from '@/types/income';
import { useMemo } from 'react';

import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Text } from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useCalendarEventsQuery } from '@/features/calendar/calendar.api';
import { useContractsQuery } from '@/features/contracts/contracts.api';
import { useIncomeEntriesQuery } from '@/features/income/income.api';
import { useProfileQuery } from '@/features/profile/profile.api';
import { useSparkCodesQuery } from '@/features/spark-codes/spark-codes.api';

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function sumByDate(entries: IncomeEntry[], fromDate: string, toDate: string): number {
  return entries
    .filter(e => e.date >= fromDate && e.date <= toDate)
    .reduce((sum, e) => sum + e.amount, 0);
}

export default function DashboardScreen() {
  const user = useAuthStore.use.user();
  const status = useAuthStore.use.status();
  const { data: profile } = useProfileQuery();
  const { data: incomeEntries = [], isLoading: incomeLoading } = useIncomeEntriesQuery();
  const { data: calendarEvents = [], isLoading: calendarLoading } = useCalendarEventsQuery();
  const { data: sparkCodes = [], isLoading: sparkLoading } = useSparkCodesQuery();
  const { data: contracts = [], isLoading: contractsLoading } = useContractsQuery();

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

  const cardClass = 'rounded-2xl border border-neutral-200/80 bg-white/95 p-4 dark:border-neutral-600/50 dark:bg-neutral-800/95';

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 24 }}
      scrollEventThrottle={16}
    >
      <Text className="mb-2 text-2xl font-bold">{greeting}</Text>
      <Text className="mb-6 text-muted-foreground">
        Today's income, upcoming promos, and deadlines.
      </Text>

      {showSignInMessage && (
        <Text className="py-4 text-muted-foreground">
          Please sign in to view your CreatorShelf dashboard.
        </Text>
      )}

      {!showSignInMessage && isLoading && (
        <View className="py-4">
          <ActivityIndicator size="small" />
        </View>
      )}

      {!showSignInMessage && !isLoading && (
        <View className="gap-4">
          {/* Income summary bar when we have entries */}
          {incomeEntries.length > 0 && (
            <View className="flex-row gap-3">
              <View className={`flex-1 ${cardClass}`}>
                <Text className="text-2xl font-semibold tabular-nums">{incomeSummary.today.toFixed(2)}</Text>
                <Text className="text-sm text-muted-foreground">Today (USD)</Text>
              </View>
              <View className={`flex-1 ${cardClass}`}>
                <Text className="text-2xl font-semibold tabular-nums">{incomeSummary.last7.toFixed(2)}</Text>
                <Text className="text-sm text-muted-foreground">Last 7 days</Text>
              </View>
              <View className={`flex-1 ${cardClass}`}>
                <Text className="text-2xl font-semibold tabular-nums">{incomeSummary.last30.toFixed(2)}</Text>
                <Text className="text-sm text-muted-foreground">Last 30 days</Text>
              </View>
            </View>
          )}

          <View className={cardClass}>
            <Text className="text-2xl font-semibold tabular-nums">{incomeEntries.length}</Text>
            <Text className="text-sm text-muted-foreground">Income entries</Text>
          </View>
          <View className={cardClass}>
            <Text className="text-2xl font-semibold tabular-nums">{calendarEvents.length}</Text>
            <Text className="text-sm text-muted-foreground">Upcoming calendar events</Text>
          </View>
          <View className={cardClass}>
            <Text className="text-2xl font-semibold tabular-nums">{activeSparkCount}</Text>
            <Text className="text-sm text-muted-foreground">Active Spark codes</Text>
          </View>
          <View className={cardClass}>
            <Text className="text-2xl font-semibold tabular-nums">{openContractsCount}</Text>
            <Text className="text-sm text-muted-foreground">Open contracts</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
