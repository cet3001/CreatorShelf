import { Stack } from 'expo-router';
import React from 'react';
import Colors from '@/constants/colors';

export default function IncomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '600' as const },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Income' }} />
    </Stack>
  );
}
