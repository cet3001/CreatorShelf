import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { ThemeProvider } from '@react-navigation/native';
import { Redirect, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useThemeConfig } from '@/components/ui/use-theme-config';
import { hydrateAuth, useAuthStore } from '@/features/auth/use-auth-store';

import { APIProvider } from '@/lib/api';
import { useIsFirstTime } from '@/lib/hooks';
import { loadSelectedTheme } from '@/lib/hooks/use-selected-theme';
// Import  global CSS file
import '../global.css';

export { ErrorBoundary } from 'expo-router';

// Cold start: show auth first; (auth) layout redirects to (app) when already signed in.
// eslint-disable-next-line react-refresh/only-export-components
export const unstable_settings = {
  initialRouteName: '(auth)',
};

hydrateAuth();
loadSelectedTheme();
// Prevent the splash screen from auto-hiding before we're ready.
SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
  duration: 500,
  fade: true,
});

export default function RootLayout() {
  const status = useAuthStore.use.status();
  const [isFirstTime] = useIsFirstTime();

  // Hide splash as soon as auth is resolved (signIn or signOut). Small delay to avoid flicker.
  useEffect(() => {
    if (status === 'signIn' || status === 'signOut') {
      const t = setTimeout(() => SplashScreen.hideAsync(), 150);
      return () => clearTimeout(t);
    }
  }, [status]);

  // Loading: show explicit full-screen loading UI (no hidden "waiting" state).
  if (status === 'loading' || status === 'idle') {
    return (
      <Providers>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </Providers>
    );
  }

  // First time user and not signed in — show onboarding.
  if (isFirstTime && status === 'signOut') {
    return (
      <Providers>
        <Stack>
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        </Stack>
        <Redirect href="/onboarding" />
      </Providers>
    );
  }

  // Resolved auth: render the stack. (auth) and (app) layouts handle redirects.
  return (
    <Providers>
      <Stack>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack>
    </Providers>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  const theme = useThemeConfig();
  return (
    <GestureHandlerRootView
      style={styles.container}
      // eslint-disable-next-line better-tailwindcss/no-unknown-classes
      className={theme.dark ? `dark` : undefined}
    >
      <KeyboardProvider>
        <ThemeProvider value={theme}>
          <APIProvider>
            <BottomSheetModalProvider>
              {children}
              <FlashMessage position="top" />
            </BottomSheetModalProvider>
          </APIProvider>
        </ThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
  },
});
