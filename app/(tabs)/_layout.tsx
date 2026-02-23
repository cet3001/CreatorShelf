import { Tabs } from 'expo-router';
import { Home, Calendar, DollarSign, Zap, FileText, Settings } from 'lucide-react-native';
import React from 'react';
import Colors from '@/constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: Colors.tabBarBg,
          borderTopWidth: 1,
          borderTopColor: Colors.tabBarBorder,
        },
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: '600' as const,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Dashboard',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          tabBarButtonTestID: 'dashboard-tab',
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
          tabBarButtonTestID: 'calendar-tab',
        }}
      />
      <Tabs.Screen
        name="income"
        options={{
          title: 'Income',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <DollarSign color={color} size={size} />,
          tabBarButtonTestID: 'income-tab',
        }}
      />
      <Tabs.Screen
        name="spark-codes"
        options={{
          title: 'Spark',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Zap color={color} size={size} />,
          tabBarButtonTestID: 'spark-codes-tab',
        }}
      />
      <Tabs.Screen
        name="contracts"
        options={{
          title: 'Contracts',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
          tabBarButtonTestID: 'contracts-tab',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
          tabBarButtonTestID: 'settings-tab',
        }}
      />
    </Tabs>
  );
}
