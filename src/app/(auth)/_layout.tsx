import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/features/auth/use-auth-store';

export default function AuthLayout() {
  const user = useAuthStore.use.user();
  const status = useAuthStore.use.status();

  if (status === 'signIn' && user) {
    return <Redirect href="/(app)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
}
