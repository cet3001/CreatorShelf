import { Stack } from 'expo-router';
import React from 'react';
import Colors from '@/constants/colors';

export default function SparkCodesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '600' as const },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'SparkCodes' }} />
      <Stack.Screen name="[id]" options={{ title: 'Spark Code Details' }} />
    </Stack>
  );
}
