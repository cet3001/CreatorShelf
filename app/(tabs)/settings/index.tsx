import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { ChevronRight, Globe, Moon, User, Star, Share2, HelpCircle, FileText, Shield, LogOut } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuthStore, getCurrentUserId } from '@/store/auth-store';
import { updateProfile } from '@/features/profile/profile-api';
import { useQuery } from '@tanstack/react-query';
import { getProfileByUserId } from '@/features/profile/profile-api';

const TERMS_URL = 'https://creatorshelf.io/terms';
const PRIVACY_URL = 'https://creatorshelf.io/privacy';

type SettingsItemProps = {
  label: string;
  value?: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
};

function SettingsItem({ label, value, icon, onPress, destructive }: SettingsItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.settingsItem, pressed && onPress && styles.settingsItemPressed]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingsItemLeft}>
        {icon && <View style={styles.settingsIcon}>{icon}</View>}
        <Text style={[styles.settingsLabel, destructive && styles.destructiveText]}>{label}</Text>
      </View>
      <View style={styles.settingsItemRight}>
        {value ? <Text style={styles.settingsValue}>{value}</Text> : null}
        {onPress && <ChevronRight size={16} color={Colors.textMuted} />}
      </View>
    </Pressable>
  );
}

function SettingsSection({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      {title ? <Text style={styles.sectionHeader}>{title}</Text> : null}
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const signOut = useAuthStore((s) => s.signOut);
  const userId = useAuthStore((s) => s.user?.id) ?? null;
  const queryClient = useQueryClient();
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [editFirstName, setEditFirstName] = useState<string>('');

  const { data: profile } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => userId ? getProfileByUserId(userId) : null,
    enabled: !!userId,
  });

  const openEditProfile = () => {
    setEditFirstName(profile?.first_name ?? '');
    setEditModalVisible(true);
  };

  const saveProfile = async () => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId || !editFirstName.trim()) return;
    try {
      await updateProfile(currentUserId, { first_name: editFirstName.trim() });
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      setEditModalVisible(false);
    } catch {
      setEditModalVisible(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Settings</Text>

      <SettingsSection title="General">
        <SettingsItem
          label="Edit profile"
          value={profile?.first_name ?? '—'}
          icon={<User size={18} color={Colors.textSecondary} />}
          onPress={openEditProfile}
        />
      </SettingsSection>

      <SettingsSection title="About">
        <SettingsItem
          label="App name"
          value="CreatorShelf"
          icon={<Globe size={18} color={Colors.textSecondary} />}
        />
        <SettingsItem
          label="Version"
          value="1.0.0"
          icon={<Moon size={18} color={Colors.textSecondary} />}
        />
      </SettingsSection>

      <SettingsSection title="Support">
        <SettingsItem
          label="Share"
          icon={<Share2 size={18} color={Colors.textSecondary} />}
          onPress={() => {}}
        />
        <SettingsItem
          label="Rate"
          icon={<Star size={18} color={Colors.textSecondary} />}
          onPress={() => {}}
        />
        <SettingsItem
          label="Support"
          icon={<HelpCircle size={18} color={Colors.textSecondary} />}
          onPress={() => {}}
        />
      </SettingsSection>

      <SettingsSection title="Links">
        <SettingsItem
          label="Terms of service"
          icon={<FileText size={18} color={Colors.textSecondary} />}
          onPress={() => WebBrowser.openBrowserAsync(TERMS_URL)}
        />
        <SettingsItem
          label="Privacy policy"
          icon={<Shield size={18} color={Colors.textSecondary} />}
          onPress={() => WebBrowser.openBrowserAsync(PRIVACY_URL)}
        />
      </SettingsSection>

      <SettingsSection>
        <SettingsItem
          label="Sign out"
          icon={<LogOut size={18} color={Colors.danger} />}
          onPress={handleSignOut}
          destructive
        />
      </SettingsSection>

      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit profile</Text>
            <Pressable onPress={() => setEditModalVisible(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </Pressable>
          </View>
          <View style={styles.modalContent}>
            <Text style={styles.label}>First name</Text>
            <TextInput
              style={styles.input}
              value={editFirstName}
              onChangeText={setEditFirstName}
              placeholder="Your first name"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
            <Pressable
              style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
              onPress={saveProfile}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 24,
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionContent: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.cardBorder,
  },
  settingsItemPressed: {
    backgroundColor: Colors.surfaceLight,
  },
  settingsItemLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    flex: 1,
  },
  settingsIcon: {
    width: 28,
    alignItems: 'center' as const,
  },
  settingsLabel: {
    fontSize: 15,
    color: Colors.text,
  },
  destructiveText: {
    color: Colors.danger,
  },
  settingsItemRight: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  settingsValue: {
    fontSize: 14,
    color: Colors.textSecondary,
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
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 10,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center' as const,
    marginTop: 20,
  },
  saveButtonPressed: {
    opacity: 0.85,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
