import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth, homeForRole } from '@/lib/auth';
import { Loading } from './ui/kit';
import type { Role } from '@/lib/types';

/** Renders children only for signed-in users with one of the given roles (admins pass every guard). */
export function RoleGuard({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const { session, role, profile, loading } = useAuth();
  if (loading || (session && !profile)) return <Loading />;
  if (!session) return <Redirect href="/(auth)/login" />;
  if (!role || (!roles.includes(role) && role !== 'admin')) return <Redirect href={homeForRole(role) as any} />;
  return <>{children}</>;
}
