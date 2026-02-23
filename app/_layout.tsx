import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Colors from "@/constants/colors";
import { useAuthStore } from "@/store/auth-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IS_FIRST_TIME_KEY } from "@/lib/storage";
import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const hydrate = useAuthStore((s) => s.hydrate);
  const router = useRouter();
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(IS_FIRST_TIME_KEY).then((val) => {
      setIsFirstTime(val !== 'false');
    }).catch(() => {
      setIsFirstTime(true);
    });
  }, []);

  useEffect(() => {
    if (status === 'signIn' || status === 'signOut') {
      const t = setTimeout(() => SplashScreen.hideAsync(), 150);
      return () => clearTimeout(t);
    }
  }, [status]);

  useEffect(() => {
    if (isFirstTime === null) return;
    if (status === 'loading' || status === 'idle') return;

    if (isFirstTime && status === 'signOut') {
      router.replace('/onboarding' as any);
    } else if (status === 'signOut') {
      router.replace('/sign-in' as any);
    } else if (status === 'signIn' && user) {
      router.replace('/(tabs)' as any);
    }
  }, [status, isFirstTime, user]);

  if (status === 'loading' || status === 'idle' || isFirstTime === null) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingLogoBg}>
          <Text style={styles.loadingLogoText}>CS</Text>
        </View>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="sign-up" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={styles.root}>
          <RootLayoutNav />
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 16,
    backgroundColor: Colors.background,
  },
  loadingLogoBg: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 8,
  },
  loadingLogoText: {
    fontSize: 30,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
});
