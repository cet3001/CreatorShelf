import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { Redirect, SplashScreen, Tabs } from 'expo-router';
import * as React from 'react';
import { useCallback, useEffect } from 'react';

import colors from '@/components/ui/colors';
import { Home } from '@/components/ui/icons';
import { useAuthStore as useAuth } from '@/features/auth/use-auth-store';
import { useIsFirstTime } from '@/lib/hooks/use-is-first-time';

// Demo tabs (feed, style, settings) removed from navigation; screen files kept for reference.

export default function TabLayout() {
  const theme = useTheme();
  const status = useAuth.use.status();
  const [isFirstTime] = useIsFirstTime();
  const hideSplash = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);
  useEffect(() => {
    if (status !== 'idle') {
      const timer = setTimeout(() => {
        hideSplash();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hideSplash, status]);

  const tabBarActiveTintColor = theme.colors.primary;
  const tabBarInactiveTintColor = theme.dark
    ? colors.charcoal[400]
    : colors.neutral[500];
  const tabBarStyle = {
    backgroundColor: theme.dark ? 'rgba(15, 18, 20, 0.92)' : 'rgba(250, 250, 250, 0.92)',
    borderTopWidth: 1,
    borderTopColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
  };

  if (isFirstTime) {
    return <Redirect href="/onboarding" />;
  }
  if (status === 'signOut') {
    return <Redirect href="/(auth)/sign-in" />;
  }
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor,
        tabBarInactiveTintColor,
        tabBarStyle,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Home color={color} />,
          tabBarButtonTestID: 'dashboard-tab',
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size ?? 24} color={color} />
          ),
          tabBarButtonTestID: 'calendar-tab',
        }}
      />
      <Tabs.Screen
        name="income"
        options={{
          title: 'Income',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash-outline" size={size ?? 24} color={color} />
          ),
          tabBarButtonTestID: 'income-tab',
        }}
      />
      <Tabs.Screen
        name="spark-codes"
        options={{
          title: 'SparkCodes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="code-slash-outline" size={size ?? 24} color={color} />
          ),
          tabBarButtonTestID: 'spark-codes-tab',
        }}
      />
      <Tabs.Screen
        name="contracts"
        options={{
          title: 'Contracts',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size ?? 24} color={color} />
          ),
          tabBarButtonTestID: 'contracts-tab',
        }}
      />
      {/* Demo screens: kept for reference, hidden from tab bar */}
      <Tabs.Screen
        name="style"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
