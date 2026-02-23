import { useQueryClient } from '@tanstack/react-query';
import Env from 'env';
import * as WebBrowser from 'expo-web-browser';
import * as React from 'react';
import { Alert } from 'react-native';

import { useUniwind } from 'uniwind';
import {
  Button,
  colors,
  FocusAwareStatusBar,
  Input,
  Modal,
  ScrollView,
  Text,
  useModal,
  View,
} from '@/components/ui';
import { Rate, Share, Support } from '@/components/ui/icons';
import { getCurrentUserId, useAuthStore } from '@/features/auth/use-auth-store';
import { updateProfile, useProfileQuery } from '@/features/profile/profile.api';
import { translate } from '@/lib/i18n';
import { LanguageItem } from './components/language-item';
import { SettingsContainer } from './components/settings-container';
import { SettingsItem } from './components/settings-item';
import { ThemeItem } from './components/theme-item';

const TERMS_URL = 'https://creatorshelf.io/terms';
const PRIVACY_URL = 'https://creatorshelf.io/privacy';

function ProfileSection({
  firstName,
  onEditPress,
}: { firstName: string | undefined; onEditPress: () => void }) {
  return (
    <SettingsContainer title="settings.generale">
      <LanguageItem />
      <ThemeItem />
      <SettingsItem
        text="settings.edit_profile"
        value={firstName ?? '—'}
        onPress={onEditPress}
      />
    </SettingsContainer>
  );
}

function AccountSection() {
  return (
    <SettingsContainer title="settings.about">
      <SettingsItem
        text="settings.app_name"
        value={Env.EXPO_PUBLIC_NAME}
      />
      <SettingsItem
        text="settings.version"
        value={Env.EXPO_PUBLIC_VERSION}
      />
    </SettingsContainer>
  );
}

function SupportSection({ iconColor }: { iconColor: string }) {
  return (
    <SettingsContainer title="settings.support_us">
      <SettingsItem text="settings.share" icon={<Share color={iconColor} />} onPress={() => {}} />
      <SettingsItem text="settings.rate" icon={<Rate color={iconColor} />} onPress={() => {}} />
      <SettingsItem text="settings.support" icon={<Support color={iconColor} />} onPress={() => {}} />
    </SettingsContainer>
  );
}

function LinksSection() {
  return (
    <SettingsContainer title="settings.links">
      <SettingsItem text="settings.terms" onPress={() => WebBrowser.openBrowserAsync(TERMS_URL)} />
      <SettingsItem text="settings.privacy" onPress={() => WebBrowser.openBrowserAsync(PRIVACY_URL)} />
    </SettingsContainer>
  );
}

export function SettingsScreen() {
  const signOut = useAuthStore.use.signOut();
  const { theme } = useUniwind();
  const queryClient = useQueryClient();
  const iconColor = theme === 'dark' ? colors.neutral[400] : colors.neutral[500];
  const editProfileModal = useModal();
  const { data: profile } = useProfileQuery();
  const userId = getCurrentUserId();
  const [editFirstName, setEditFirstName] = React.useState(profile?.first_name ?? '');

  const openEditProfile = React.useCallback(() => {
    setEditFirstName(profile?.first_name ?? '');
    editProfileModal.present();
  }, [profile?.first_name, editProfileModal]);

  const saveProfile = async () => {
    if (!userId || !editFirstName.trim())
      return;

    try {
      await updateProfile(userId, { first_name: editFirstName.trim() });
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      editProfileModal.dismiss();
    }
    catch {
      // Error could be shown in modal; for now just close
      editProfileModal.dismiss();
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
    <>
      <FocusAwareStatusBar />

      <ScrollView>
        <View className="flex-1 px-4 pt-16">
          <Text className="text-xl font-bold">
            {translate('settings.title')}
          </Text>
          <ProfileSection firstName={profile?.first_name} onEditPress={openEditProfile} />
          <AccountSection />
          <SupportSection iconColor={iconColor} />
          <LinksSection />

          <View className="my-8">
            <SettingsContainer>
              <SettingsItem
                text="settings.logout"
                onPress={handleSignOut}
              />
            </SettingsContainer>
          </View>
        </View>
      </ScrollView>

      <Modal
        ref={editProfileModal.ref}
        snapPoints={['40%']}
        title="Edit profile"
      >
        <View className="px-4 pb-6">
          <Input
            label="First name"
            value={editFirstName}
            onChangeText={setEditFirstName}
            placeholder="Your first name"
          />
          <Button
            label="Save"
            variant="secondary"
            onPress={saveProfile}
            className="mt-4"
          />
        </View>
      </Modal>
    </>
  );
}
