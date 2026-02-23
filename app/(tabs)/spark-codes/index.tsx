import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { BarChart3, ChevronRight, ExternalLink, Zap } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';
import { listSparkCodesWithStats, createSparkCode } from '@/features/spark-codes/spark-codes-api';
import { SparkCodeWithStats } from '@/types/spark-codes';
import { toHumanMessage } from '@/lib/error-message';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getRedirectBaseUrl } from '@/lib/trpc';

const SPARK_STATUSES = ['draft', 'sent_to_brand', 'active', 'expired'] as const;

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

export default function SparkCodesScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const configured = isSupabaseConfigured();

  const { data: codes = [], isLoading, error } = useQuery({
    queryKey: ['spark-codes', 'list'],
    queryFn: listSparkCodesWithStats,
    enabled: !!userId,
  });

  const [code, setCode] = useState<string>('');
  const [destinationUrl, setDestinationUrl] = useState<string>('');
  const [deepLinkIos, setDeepLinkIos] = useState<string>('');
  const [deepLinkAndroid, setDeepLinkAndroid] = useState<string>('');
  const [brandName, setBrandName] = useState<string>('');
  const [status, setStatus] = useState<typeof SPARK_STATUSES[number]>('draft');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  const mutation = useMutation({
    mutationFn: createSparkCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spark-codes', 'list'] });
      setCode('');
      setDestinationUrl('');
      setDeepLinkIos('');
      setDeepLinkAndroid('');
      setBrandName('');
      setStatus('draft');
      setExpiresAt('');
      setNote('');
      setIsActive(true);
    },
  });

  const handleAdd = () => {
    if (!code.trim()) return;
    mutation.mutate({
      code: code.trim(),
      destination_url: destinationUrl.trim() || null,
      deep_link_ios: deepLinkIos.trim() || null,
      deep_link_android: deepLinkAndroid.trim() || null,
      is_active: isActive,
      brand_name: brandName.trim() || null,
      platform: null,
      status,
      expires_at: expiresAt.trim() || null,
      note: note.trim() || null,
    });
  };

  if (!configured) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.pageTitle}>SparkCodes</Text>
          <Text style={styles.pageSubtitle}>Track Spark codes, video links, and brand status.</Text>
          <View style={styles.infoBanner}>
            <Text style={styles.infoText}>Supabase not configured. Add your env vars to enable Spark codes.</Text>
          </View>
        </View>
      </View>
    );
  }

  const listHeader = (
    <View>
      <Text style={styles.pageTitle}>SparkCodes</Text>
      <Text style={styles.pageSubtitle}>Intelligent routing, analytics & brand tracking.</Text>
      <Text style={styles.sectionTitle}>Your Spark Codes</Text>
      {isLoading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      )}
      {error && <Text style={styles.errorText}>{toHumanMessage(error)}</Text>}
      {!isLoading && !error && codes.length === 0 && (
        <Text style={styles.emptyText}>No Spark codes yet. Create one below.</Text>
      )}
    </View>
  );

  const listFooter = (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Create Spark Code</Text>

      <Text style={styles.label}>Code</Text>
      <TextInput style={styles.input} value={code} onChangeText={setCode} placeholder="Spark code" placeholderTextColor={Colors.textMuted} testID="spark-code-input" />

      <Text style={styles.label}>Destination URL</Text>
      <TextInput style={styles.input} value={destinationUrl} onChangeText={setDestinationUrl} placeholder="https://tiktok.com/..." placeholderTextColor={Colors.textMuted} autoCapitalize="none" keyboardType="url" />

      <Text style={styles.label}>iOS Deep Link (optional)</Text>
      <TextInput style={styles.input} value={deepLinkIos} onChangeText={setDeepLinkIos} placeholder="myapp://content/123" placeholderTextColor={Colors.textMuted} autoCapitalize="none" />

      <Text style={styles.label}>Android Deep Link (optional)</Text>
      <TextInput style={styles.input} value={deepLinkAndroid} onChangeText={setDeepLinkAndroid} placeholder="myapp://content/123" placeholderTextColor={Colors.textMuted} autoCapitalize="none" />

      <Text style={styles.label}>Brand (optional)</Text>
      <TextInput style={styles.input} value={brandName} onChangeText={setBrandName} placeholder="Brand name" placeholderTextColor={Colors.textMuted} />

      <Text style={styles.label}>Status</Text>
      <View style={styles.statusRow}>
        {SPARK_STATUSES.map((s) => (
          <Pressable key={s} style={[styles.statusChip, status === s && styles.statusChipActive]} onPress={() => setStatus(s)}>
            <Text style={[styles.statusChipText, status === s && styles.statusChipTextActive]}>
              {s.replace(/_/g, ' ')}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Active</Text>
        <Switch
          value={isActive}
          onValueChange={setIsActive}
          trackColor={{ false: Colors.surfaceLight, true: Colors.primary }}
          thumbColor={Colors.white}
        />
      </View>

      <Text style={styles.label}>Expires at (optional)</Text>
      <TextInput style={styles.input} value={expiresAt} onChangeText={setExpiresAt} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textMuted} />

      <Text style={styles.label}>Note (optional)</Text>
      <TextInput style={styles.input} value={note} onChangeText={setNote} placeholder="Note" placeholderTextColor={Colors.textMuted} />

      <Pressable style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]} onPress={handleAdd} disabled={mutation.isPending} testID="add-spark-code-btn">
        {mutation.isPending ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={styles.addButtonText}>Create Spark Code</Text>}
      </Pressable>

      {mutation.isError && <Text style={styles.errorText}>{toHumanMessage(mutation.error)}</Text>}
    </View>
  );

  const renderItem = ({ item }: { item: SparkCodeWithStats }) => {
    const expired = item.expires_at ? isExpired(item.expires_at) : false;
    const active = item.status === 'active' && !expired;
    const baseUrl = getRedirectBaseUrl();
    const shortLink = baseUrl ? `${baseUrl}/${item.short_code}` : item.short_code;

    return (
      <Pressable
        style={({ pressed }) => [styles.codeCard, pressed && styles.codeCardPressed]}
        onPress={() => router.push(`/spark-codes/${item.id}` as any)}
        testID={`spark-code-${item.id}`}
      >
        <View style={styles.codeCardTop}>
          <View style={styles.codeIconWrap}>
            <Zap size={16} color={Colors.primary} />
          </View>
          <View style={styles.codeCardInfo}>
            <Text style={styles.codeText} numberOfLines={1}>{item.code}</Text>
            {item.brand_name ? <Text style={styles.codeMeta}>{item.brand_name}</Text> : null}
          </View>
          <View style={[styles.statusBadge, active && styles.statusBadgeActive, expired && styles.statusBadgeExpired]}>
            <Text style={[styles.statusBadgeText, active && styles.statusBadgeTextActive, expired && styles.statusBadgeTextExpired]}>
              {expired ? 'Expired' : item.status.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>

        <View style={styles.codeCardBottom}>
          {item.short_code ? (
            <View style={styles.shortLinkPill}>
              <ExternalLink size={11} color={Colors.primary} />
              <Text style={styles.shortLinkPillText} numberOfLines={1}>
                {shortLink}
              </Text>
            </View>
          ) : null}
          <View style={styles.scansBadge}>
            <BarChart3 size={12} color={Colors.textSecondary} />
            <Text style={styles.scansText}>{item.total_scans} scans</Text>
          </View>
          <ChevronRight size={16} color={Colors.textMuted} />
        </View>
      </Pressable>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={100}>
      {!isLoading && !error && codes.length > 0 ? (
        <FlatList
          style={styles.container}
          contentContainerStyle={styles.content}
          data={codes}
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
  codeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
    marginBottom: 10,
  },
  codeCardPressed: {
    opacity: 0.85,
  },
  codeCardTop: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 10,
  },
  codeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: 'rgba(13, 148, 136, 0.12)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  codeCardInfo: {
    flex: 1,
  },
  codeText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  codeMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: Colors.surfaceLight,
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  statusBadgeExpired: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    textTransform: 'capitalize' as const,
  },
  statusBadgeTextActive: {
    color: Colors.success,
  },
  statusBadgeTextExpired: {
    color: Colors.warning,
  },
  codeCardBottom: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  shortLinkPill: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: 'rgba(13, 148, 136, 0.06)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  shortLinkPillText: {
    fontSize: 11,
    color: Colors.primary,
    flex: 1,
  },
  scansBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  scansText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
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
  switchRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginTop: 10,
    marginBottom: 4,
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
