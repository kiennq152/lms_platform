import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function InstructorLayout() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: themeColors.background,
        },
        headerTintColor: themeColors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color="#F44336" />
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        ),
      }}>
      <Stack.Screen
        name="dashboard"
        options={{
          title: 'Instructor Dashboard',
          headerLeft: () => null, // Hide back button on main dashboard
        }}
      />
      <Stack.Screen
        name="create-course"
        options={{
          title: 'Tạo Khóa Học Mới',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    gap: 4,
  },
  logoutText: {
    color: '#F44336',
    fontWeight: '600',
    fontSize: 14,
  },
});
