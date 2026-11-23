import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { notify } from './notify';
import type { AppSettings, Profile, Role } from './types';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  role: Role | null;
  loading: boolean;
  settings: AppSettings | null;
  refreshProfile: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function homeForRole(role: Role | null | undefined): string {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'instructor') return '/instructor/dashboard';
  return '/(tabs)';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (s: Session | null) => {
    if (!s?.user) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase.from('users').select('*').eq('id', s.user.id).maybeSingle();
    if (error) {
      // Keep what we already know about this user on a transient failure.
      setProfile((p) => (p?.id === s.user.id ? p : null));
      return;
    }
    if (data?.status === 'suspended') {
      await supabase.auth.signOut();
      setProfile(null);
      setSession(null);
      notify('Tài khoản bị khoá', 'Tài khoản của bạn đã bị tạm khoá. Vui lòng liên hệ bộ phận hỗ trợ.');
      return;
    }
    setProfile((data as Profile) ?? null);
  }, []);

  const refreshSettings = useCallback(async () => {
    const { data } = await supabase.from('app_settings').select('*').eq('id', 1).maybeSingle();
    setSettings((data as AppSettings) ?? null);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      await Promise.all([loadProfile(data.session), refreshSettings()]);
      if (mounted) setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      // supabase-js re-emits the session on tab focus and token refresh. Keep the same object for the same
      // user so screens do not reload and drop what the user is doing.
      setSession((prev) => (prev && s && prev.user.id === s.user.id ? prev : s));
      // Defer DB calls out of the auth callback (supabase-js recommendation).
      setTimeout(() => {
        loadProfile(s);
        if (event === 'SIGNED_IN' && s?.user) {
          supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', s.user.id).then(() => {});
        }
      }, 0);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile, refreshSettings]);

  const value = useMemo<AuthState>(() => ({
    session,
    profile,
    role: (profile?.role as Role) ?? (session ? 'student' : null),
    loading,
    settings,
    refreshProfile: () => loadProfile(session),
    refreshSettings,
    signOut: async () => {
      await supabase.auth.signOut();
      setProfile(null);
      setSession(null);
    },
  }), [session, profile, loading, settings, loadProfile, refreshSettings]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
