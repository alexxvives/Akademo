'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import type { User, ApiResponse } from '@/types';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAcademy: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  refetch: () => Promise<void>;
  logout: () => Promise<void>;
}

// Module-level cache to share across components
let cachedUser: User | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Hook for managing authentication state
 * 
 * Caches the user data to prevent redundant API calls.
 * All components using this hook share the same cached data.
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(cachedUser);
  const [loading, setLoading] = useState(!cachedUser);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async (force = false): Promise<void> => {
    const now = Date.now();
    
    // Return cached user if still valid and not forcing refresh
    if (!force && cachedUser && (now - cacheTimestamp) < CACHE_TTL) {
      setUser(cachedUser);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const res = await apiClient('/auth/me');
      const result: ApiResponse<User> = await res.json();
      
      if (result.success && result.data) {
        cachedUser = result.data;
        cacheTimestamp = now;
        setUser(result.data);
      } else {
        cachedUser = null;
        setUser(null);
        if (result.error) {
          setError(result.error);
        }
      }
    } catch (e) {
      console.error('[useAuth] Error fetching user:', e);
      cachedUser = null;
      setUser(null);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('[useAuth] Logout error:', e);
    } finally {
      cachedUser = null;
      cacheTimestamp = 0;
      setUser(null);
      localStorage.removeItem('auth_token');
      window.location.href = '/';
    }
  }, []);

  const refetch = useCallback(() => fetchUser(true), [fetchUser]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const isAuthenticated = useMemo(() => !!user, [user]);
  const isAdmin = useMemo(() => user?.role === 'ADMIN', [user]);
  const isAcademy = useMemo(() => user?.role === 'ACADEMY', [user]);
  const isTeacher = useMemo(() => user?.role === 'TEACHER', [user]);
  const isStudent = useMemo(() => user?.role === 'STUDENT', [user]);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    isAcademy,
    isTeacher,
    isStudent,
    refetch,
    logout,
  };
}

/**
 * Clear the auth cache (call after login/logout)
 */
export function clearAuthCache(): void {
  cachedUser = null;
  cacheTimestamp = 0;
}

export default useAuth;
