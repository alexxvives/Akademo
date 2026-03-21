'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import type { User } from './types';

export function useDashboardAuth(role: string) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuspicionWarning, setShowSuspicionWarning] = useState(false);

  const handleLogout = useCallback(async () => {
    if (typeof window !== 'undefined' && (window as { akademoUploading?: boolean }).akademoUploading) {
      const confirmLogout = window.confirm(
        '⚠️ ADVERTENCIA: Hay un video subiendo. Si cierras sesión, se cancelará la subida.\n\n¿Estás seguro de que quieres cerrar sesión?'
      );
      if (!confirmLogout) return;
    }
    await apiClient('/auth/logout', { method: 'POST' });
    localStorage.removeItem('auth_token');
    const joinOrigin = role === 'STUDENT' ? localStorage.getItem('akademo_join_origin') : null;
    router.push(joinOrigin ? `${joinOrigin}?login=true` : '/');
  }, [router, role]);

  const checkSession = useCallback(async () => {
    try {
      const response = await apiClient('/auth/session/check', { method: 'POST' });
      const result = await response.json();
      if (!result.success || !result.data?.id) {
        if (result.data?.message) alert(result.data.message);
        handleLogout();
      } else if (result.data?.suspicionWarning) {
        setShowSuspicionWarning(true);
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
  }, [handleLogout]);

  const checkAuth = useCallback(async () => {
    try {
      const response = await apiClient('/auth/me');
      const result = await response.json();
      if (result.success && result.data) {
        const userRole = result.data.role;
        const hasAccess =
          userRole === role ||
          (userRole === 'ACADEMY' && role === 'TEACHER') ||
          userRole === 'ADMIN';
        if (hasAccess) {
          setUser(result.data);
        } else {
          router.push('/?modal=login');
        }
      } else {
        router.push('/?modal=login');
      }
    } catch {
      router.push('/?modal=login');
    } finally {
      setLoading(false);
    }
  }, [role, router]);

  return {
    user,
    loading,
    showSuspicionWarning,
    setShowSuspicionWarning,
    handleLogout,
    checkSession,
    checkAuth,
  };
}
