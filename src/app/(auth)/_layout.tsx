import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

import { useAuthStore } from '@/features/auth/use-auth-store';

export default function AuthLayout() {
  const user = useAuthStore.use.user();
  const status = useAuthStore.use.status();

  if (status === 'signIn' && user) {
    return <Redirect href="/(app)" />;
  }

  // Show visible loading state so we never render nothing while auth is resolving.
  if (status === 'loading' || status === 'idle') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
        <ActivityIndicator size="large" />
        <Text>Loading…</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
}
