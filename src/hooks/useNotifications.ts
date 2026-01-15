'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { Notification, ApiResponse } from '@/types';

interface UseNotificationsOptions {
  pollInterval?: number;
  autoFetch?: boolean;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

/**
 * Hook for managing notifications
 */
export function useNotifications({
  pollInterval = 15000,
  autoFetch = true,
}: UseNotificationsOptions = {}): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const res = await apiClient('/notifications');
      const result: ApiResponse<Notification[]> = await res.json();
      
      if (result.success && result.data) {
        setNotifications(result.data);
      }
    } catch (e) {
      console.error('[useNotifications] Error:', e);
      setError('Error loading notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string): Promise<void> => {
    try {
      await apiClient(`/notifications/${id}/read`, { method: 'POST' });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (e) {
      console.error('[useNotifications] Error marking as read:', e);
    }
  }, []);

  const markAllAsRead = useCallback(async (): Promise<void> => {
    try {
      await apiClient('/notifications/read-all', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error('[useNotifications] Error marking all as read:', e);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchNotifications();
    }
  }, [autoFetch, fetchNotifications]);

  useEffect(() => {
    if (!pollInterval) return;

    const interval = setInterval(fetchNotifications, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval, fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}

export default useNotifications;
