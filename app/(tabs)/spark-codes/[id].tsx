import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Copy,
  ExternalLink,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  TrendingUp,
  Zap,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import Colors from '@/constants/colors';
import { getSparkCodeById } from '@/features/spark-codes/spark-codes-api';
import { getAnalyticsForCode } from '@/features/scan-events/scan-events-api';
import { getRedirectBaseUrl } from '@/lib/trpc';
import { toHumanMessage } from '@/lib/error-message';

function getDeviceIcon(device: string) {
  switch (device.toLowerCase()) {
    case 'mobile':
      return Smartphone;
    case 'tablet':
      return Tablet;
    case 'desktop':
      return Monitor;
    default:
      return Monitor;
  }
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <View style={[styles.statCard, accent && styles.statCardAccent]}>
      <Text style={[styles.statValue, accent && styles.statValueAccent]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, accent && styles.statLabelAccent]}>
        {label}
      </Text>
    </View>
  );
}

function BarRow({
  label,
  count,
  maxCount,
  color,
}: {
  label: string;
  count: number;
  maxCount: number;
  color: string;
}) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <View style={styles.barRow}>
      <View style={styles.barLabelWrap}>
        <Text style={styles.barLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.barCount}>{count}</Text>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[styles.barFill, { width: `${Math.max(pct, 2)}%`, backgroundColor: color }]}
        />
      </View>
    </View>
  );
}

export default function SparkCodeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: sparkCode,
    isLoading: codeLoading,
    error: codeError,
  } = useQuery({
    queryKey: ['spark-code', id],
    queryFn: () => getSparkCodeById(id!),
    enabled: !!id,
  });

  const {
    data: analytics,
    isLoading: analyticsLoading,
  } = useQuery({
    queryKey: ['spark-code-analytics', id],
    queryFn: () => getAnalyticsForCode(id!),
    enabled: !!id,
  });

  const shortLink = useMemo(() => {
    if (!sparkCode?.short_code) return '';
    const base = getRedirectBaseUrl();
    return base ? `${base}/${sparkCode.short_code}` : sparkCode.short_code;
  }, [sparkCode?.short_code]);

  const maxDeviceCount = useMemo(
    () =>
      analytics?.scans_by_device.reduce((m, d) => Math.max(m, d.count), 0) ?? 0,
    [analytics?.scans_by_device],
  );

  const maxOsCount = useMemo(
    () => analytics?.scans_by_os.reduce((m, d) => Math.max(m, d.count), 0) ?? 0,
    [analytics?.scans_by_os],
  );

  const maxCountryCount = useMemo(
    () =>
      analytics?.scans_by_country.reduce((m, d) => Math.max(m, d.count), 0) ?? 0,
    [analytics?.scans_by_country],
  );

  const maxDayCount = useMemo(
    () =>
      analytics?.scans_by_day.reduce((m, d) => Math.max(m, d.count), 0) ?? 0,
    [analytics?.scans_by_day],
  );

  const handleCopyLink = async () => {
    if (!shortLink) return;
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(shortLink);
      } else {
        await Clipboard.setStringAsync(shortLink);
      }
      console.log('[SparkDetail] copied short link');
    } catch (e) {
      console.log('[SparkDetail] copy failed:', e);
    }
  };

  if (codeLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (codeError || !sparkCode) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {codeError ? toHumanMessage(codeError) : 'Spark code not found.'}
        </Text>
      </View>
    );
  }

  const isExpired =
    sparkCode.expires_at && new Date(sparkCode.expires_at) < new Date();
  const isActive = sparkCode.status === 'active' && !isExpired;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.codeIconWrap}>
            <Zap size={20} color={Colors.primary} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.codeText} selectable>
              {sparkCode.code}
            </Text>
            {sparkCode.brand_name ? (
              <Text style={styles.brandText}>{sparkCode.brand_name}</Text>
            ) : null}
          </View>
          <View
            style={[
              styles.statusPill,
              isActive && styles.statusPillActive,
              isExpired && styles.statusPillExpired,
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                isActive && styles.statusPillTextActive,
                isExpired && styles.statusPillTextExpired,
              ]}
            >
              {isExpired
                ? 'Expired'
                : sparkCode.status.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>

        {shortLink ? (
          <Pressable style={styles.shortLinkRow} onPress={handleCopyLink}>
            <ExternalLink size={14} color={Colors.primary} />
            <Text style={styles.shortLinkText} numberOfLines={1}>
              {shortLink}
            </Text>
            <Copy size={14} color={Colors.textMuted} />
          </Pressable>
        ) : null}

        {sparkCode.destination_url ? (
          <View style={styles.metaRow}>
            <Globe size={13} color={Colors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {sparkCode.destination_url}
            </Text>
          </View>
        ) : null}

        {sparkCode.deep_link_ios ? (
          <View style={styles.metaRow}>
            <Smartphone size={13} color={Colors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>
              iOS: {sparkCode.deep_link_ios}
            </Text>
          </View>
        ) : null}

        {sparkCode.deep_link_android ? (
          <View style={styles.metaRow}>
            <Smartphone size={13} color={Colors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>
              Android: {sparkCode.deep_link_android}
            </Text>
          </View>
        ) : null}

        {sparkCode.note ? (
          <Text style={styles.noteText}>{sparkCode.note}</Text>
        ) : null}
      </View>

      <View style={styles.statsRow}>
        <StatCard
          label="Total Scans"
          value={analytics?.total_scans ?? '—'}
          accent
        />
        <StatCard
          label="Devices"
          value={analytics?.scans_by_device.length ?? '—'}
        />
        <StatCard
          label="Countries"
          value={analytics?.scans_by_country.length ?? '—'}
        />
      </View>

      {analyticsLoading ? (
        <View style={styles.analyticsLoading}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.analyticsLoadingText}>Loading analytics...</Text>
        </View>
      ) : null}

      {analytics && analytics.scans_by_day.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={16} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Scans Over Time</Text>
          </View>
          {analytics.scans_by_day.slice(-14).map((d) => (
            <BarRow
              key={d.date}
              label={d.date}
              count={d.count}
              maxCount={maxDayCount}
              color={Colors.primary}
            />
          ))}
        </View>
      ) : null}

      {analytics && analytics.scans_by_device.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <BarChart3 size={16} color={Colors.primaryLight} />
            <Text style={styles.sectionTitle}>Device Breakdown</Text>
          </View>
          {analytics.scans_by_device.map((d) => {
            const Icon = getDeviceIcon(d.device_type);
            return (
              <View key={d.device_type} style={styles.deviceRow}>
                <Icon size={15} color={Colors.textSecondary} />
                <BarRow
                  label={d.device_type}
                  count={d.count}
                  maxCount={maxDeviceCount}
                  color={Colors.primaryLight}
                />
              </View>
            );
          })}
        </View>
      ) : null}

      {analytics && analytics.scans_by_os.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Monitor size={16} color="#6366f1" />
            <Text style={styles.sectionTitle}>OS Breakdown</Text>
          </View>
          {analytics.scans_by_os.map((d) => (
            <BarRow
              key={d.os}
              label={d.os}
              count={d.count}
              maxCount={maxOsCount}
              color="#6366f1"
            />
          ))}
        </View>
      ) : null}

      {analytics && analytics.scans_by_country.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Globe size={16} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Country Breakdown</Text>
          </View>
          {analytics.scans_by_country.map((d) => (
            <BarRow
              key={d.country}
              label={d.country}
              count={d.count}
              maxCount={maxCountryCount}
              color="#f59e0b"
            />
          ))}
        </View>
      ) : null}

      {analytics && analytics.total_scans === 0 ? (
        <View style={styles.emptyAnalytics}>
          <BarChart3 size={32} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No scans yet</Text>
          <Text style={styles.emptySubtitle}>
            Share your short link to start tracking scan analytics.
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.background,
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    color: Colors.danger,
    textAlign: 'center' as const,
  },
  headerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    marginBottom: 12,
  },
  codeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerInfo: {
    flex: 1,
  },
  codeText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  brandText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: Colors.surfaceLight,
  },
  statusPillActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  statusPillExpired: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'capitalize' as const,
  },
  statusPillTextActive: {
    color: Colors.success,
  },
  statusPillTextExpired: {
    color: Colors.warning,
  },
  shortLinkRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: 'rgba(13, 148, 136, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  shortLinkText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
  metaRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 4,
  },
  metaText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
  },
  noteText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic' as const,
  },
  statsRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
    alignItems: 'center' as const,
  },
  statCardAccent: {
    borderColor: 'rgba(13, 148, 136, 0.3)',
    backgroundColor: 'rgba(13, 148, 136, 0.06)',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statValueAccent: {
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statLabelAccent: {
    color: Colors.primaryLight,
  },
  analyticsLoading: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 20,
  },
  analyticsLoadingText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  barRow: {
    flex: 1,
    marginBottom: 8,
  },
  barLabelWrap: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  barCount: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
    marginLeft: 8,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceLight,
    overflow: 'hidden' as const,
  },
  barFill: {
    height: '100%' as const,
    borderRadius: 3,
  },
  deviceRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 8,
    paddingTop: 2,
  },
  emptyAnalytics: {
    alignItems: 'center' as const,
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center' as const,
    maxWidth: 260,
  },
});
