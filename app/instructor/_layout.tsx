import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth';
import { RoleGuard } from '@/components/role-guard';

function HeaderActions() {
  const router = useRouter();
  const { signOut } = useAuth();
  return (
    <View style={styles.actions}>
      <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.btn} accessibilityLabel="Về trang chủ">
        <Ionicons name="home-outline" size={20} color="#1B47A4" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={async () => {
          await signOut();
          router.replace('/(auth)/login');
        }}
        style={styles.btn}
      >
        <Ionicons name="log-out-outline" size={20} color="#F44336" />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function InstructorLayout() {
  return (
    <RoleGuard roles={['instructor']}>
      <Stack
        screenOptions={{
          headerTintColor: '#1B47A4',
          headerTitleStyle: { fontWeight: 'bold', color: '#1A2233' },
          headerRight: () => <HeaderActions />,
        }}
      >
        <Stack.Screen name="dashboard" options={{ title: 'Bảng điều khiển giảng viên', headerLeft: () => null }} />
        <Stack.Screen name="create-course" options={{ title: 'Thông tin khoá học' }} />
        <Stack.Screen name="curriculum/[id]" options={{ title: 'Nội dung khoá học' }} />
        <Stack.Screen name="students/[id]" options={{ title: 'Học viên & Hỏi đáp' }} />
      </Stack>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 8 },
  btn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4 },
  logoutText: { color: '#F44336', marginLeft: 4, fontWeight: '600' },
});
