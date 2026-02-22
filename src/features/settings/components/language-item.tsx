import * as React from 'react';
import { Alert } from 'react-native';

import { SettingsItem } from './settings-item';

export function LanguageItem() {
  const onPress = React.useCallback(() => {
    Alert.alert('Coming soon', 'Additional language support is coming in a future update.');
  }, []);

  return (
    <SettingsItem
      text="settings.language"
      value="English"
      onPress={onPress}
    />
  );
}
