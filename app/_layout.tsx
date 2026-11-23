import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/lib/auth';
import { CartProvider } from '@/lib/cart';
import { Button } from '@/components/ui/button';

export const unstable_settings = {
  anchor: '(tabs)',
};

/** Blocks the app for non-admins while maintenance mode is on (FR-091). Auth screens stay reachable so admins can sign in. */
function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { settings, role, signOut, session } = useAuth();
  const segments = useSegments();
  const onAuthScreen = segments[0] === '(auth)';
  if (!settings?.maintenance_mode || role === 'admin' || onAuthScreen) return <>{children}</>;
  return (
    <View style={styles.maintenance}>
      <Ionicons name="construct-outline" size={56} color="#1B47A4" />
      <Text style={styles.mTitle}>{settings.site_name} đang bảo trì</Text>
      <Text style={styles.mText}>{settings.maintenance_message || 'Vui lòng quay lại sau.'}</Text>
      {session ? <Button title="Đăng xuất" variant="outline" onPress={signOut} style={{ marginTop: 16 }} /> : null}
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // Registers icon fonts during static rendering too, so server and client markup match.
  useFonts({ ...Ionicons.font, ...MaterialIcons.font, ...FontAwesome.font });

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <CartProvider>
          <MaintenanceGate>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(details)" />
              <Stack.Screen name="student" />
              <Stack.Screen name="instructor" />
              <Stack.Screen name="admin" />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal', headerShown: true }} />
            </Stack>
          </MaintenanceGate>
        </CartProvider>
      </AuthProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  maintenance: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#FFF' },
  mTitle: { fontSize: 22, fontWeight: '800', color: '#1A2233', marginTop: 16, textAlign: 'center' },
  mText: { fontSize: 15, color: '#6B7280', marginTop: 8, textAlign: 'center', maxWidth: 420 },
});
