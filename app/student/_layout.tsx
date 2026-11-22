import { Stack } from 'expo-router';
import React from 'react';
import { RoleGuard } from '@/components/role-guard';

export default function StudentLayout() {
  return (
    <RoleGuard roles={['student', 'instructor']}>
      <Stack screenOptions={{ headerShown: true, headerTintColor: '#1B47A4', headerTitleStyle: { fontWeight: 'bold', color: '#1A2233' } }}>
        <Stack.Screen name="dashboard" options={{ title: 'Học tập của tôi' }} />
      </Stack>
    </RoleGuard>
  );
}
