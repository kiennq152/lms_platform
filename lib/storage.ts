import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/** Tiny async key-value store: localStorage on web, SecureStore on native. */
export const kv = {
  async get(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async set(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch {
      // ignore: storage is a convenience only
    }
  },
};
