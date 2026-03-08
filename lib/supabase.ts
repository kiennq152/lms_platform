import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

const storageAdapter = {
    getItem: (key: string) => {
        if (Platform.OS === 'web') {
            if (typeof localStorage === 'undefined') {
                return null;
            }
            return localStorage.getItem(key);
        }
        return SecureStore.getItemAsync(key);
    },
    setItem: (key: string, value: string) => {
        if (Platform.OS === 'web') {
            localStorage.setItem(key, value);
            return;
        }
        SecureStore.setItemAsync(key, value);
    },
    removeItem: (key: string) => {
        if (Platform.OS === 'web') {
            localStorage.removeItem(key);
            return;
        }
        SecureStore.deleteItemAsync(key);
    },
};

const supabaseUrl = 'https://vrrykekdxaunaawwjzeo.supabase.co';
const supabaseAnonKey = 'sb_publishable_7hQH3zZManvI3GMX3HajGA_twzEup_P';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: storageAdapter as any,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
