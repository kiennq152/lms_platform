import { Stack } from 'expo-router';
import React from 'react';

export default function DetailsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: '#1B47A4',
        headerTitleStyle: { fontWeight: 'bold', color: '#1A2233' },
        headerBackTitle: 'Quay lại',
      }}
    >
      <Stack.Screen name="course-detail" options={{ headerShown: false }} />
      <Stack.Screen name="course-player" options={{ title: 'Học bài' }} />
      <Stack.Screen name="checkout" options={{ title: 'Thanh toán' }} />
      <Stack.Screen name="certificate" options={{ title: 'Chứng chỉ' }} />
      <Stack.Screen name="topic" options={{ title: 'Thảo luận' }} />
      <Stack.Screen name="edit-profile" options={{ title: 'Chỉnh sửa hồ sơ' }} />
      <Stack.Screen name="change-password" options={{ title: 'Đổi mật khẩu' }} />
      <Stack.Screen name="support" options={{ title: 'Trợ giúp & Hỗ trợ' }} />
      <Stack.Screen name="legal" options={{ headerShown: false }} />
    </Stack>
  );
}
