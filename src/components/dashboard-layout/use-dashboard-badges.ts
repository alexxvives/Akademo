'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { generateDemoPendingPayments } from '@/lib/demo-data';
import type { Notification, ActiveStream, Academy } from './types';

export function useDashboardBadges() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeStreams, setActiveStreams] = useState<ActiveStream[]>([]);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [unreadValoracionesCount, setUnreadValoracionesCount] = useState(0);
  const [ungradedAssignmentsCount, setUngradedAssignmentsCount] = useState(0);
  const [newSubmissionsCount, setNewSubmissionsCount] = useState(0);
  const [newGradesCount, setNewGradesCount] = useState(0);
  const [unpaidClassesCount, setUnpaidClassesCount] = useState(0);
  const [studentPendingPaymentsCount, setStudentPendingPaymentsCount] = useState(0);
  const [academyId, setAcademyId] = useState<string | null>(null);
  const [academyPaymentStatus, setAcademyPaymentStatus] = useState<string | null>(null);
  const [academy, setAcademy] = useState<Academy | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await apiClient('/notifications?unread=true');
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setNotifications(result.data);
        const newCount = result.data.filter((n: Notification) => !n.isRead).length;
        setUnreadCount(newCount);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, []);

  const loadActiveStreams = useCallback(async () => {
    try {
      const response = await apiClient('/live/active');
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setActiveStreams(result.data);
      }
    } catch (error) {
      console.error('Failed to load active streams:', error);
    }
  }, []);

  const loadAcademy = useCallback(async (): Promise<string> => {
    try {
      const academyResponse = await apiClient('/academies');
      const result = await academyResponse.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        const academyData: Academy = result.data[0];
        setAcademyId(academyData.id);
        const paymentStatus = academyData.paymentStatus || 'PAID';
        setAcademyPaymentStatus(paymentStatus);
        setAcademy(academyData);
        if (paymentStatus === 'NOT PAID') {
          setPendingPaymentsCount(generateDemoPendingPayments().length);
        } else {
          const pendingRes = await apiClient('/payments/pending-count');
          const pendingResult = await pendingRes.json();
          if (pendingResult.success && typeof pendingResult.data === 'number') {
            setPendingPaymentsCount(pendingResult.data);
          }
        }
        return paymentStatus;
      }
    } catch (error) {
      console.error('Failed to load academy:', error);
    }
    return 'PAID';
  }, []);

  const loadUnreadValoraciones = useCallback(async (overridePaymentStatus?: string) => {
    try {
      const status = overridePaymentStatus || academyPaymentStatus;
      if (status === 'NOT PAID') {
        setUnreadValoracionesCount(12);
        return;
      }
      const response = await apiClient('/lessons/ratings/unread-count');
      const result = await response.json();
      if (result.success && result.data) {
        setUnreadValoracionesCount(result.data.count || 0);
      }
    } catch (error) {
      console.error('Failed to load unread valoraciones:', error);
    }
  }, [academyPaymentStatus]);

  const loadUngradedAssignments = useCallback(async (overridePaymentStatus?: string) => {
    try {
      const status = overridePaymentStatus || academyPaymentStatus;
      if (status === 'NOT PAID') {
        const { countTotalNewDemoSubmissions, countTotalUngradedDemoSubmissions } = await import('@/lib/demo-data');
        const newCount = countTotalNewDemoSubmissions();
        const ungradedCount = countTotalUngradedDemoSubmissions();
        setNewSubmissionsCount(newCount);
        setUngradedAssignmentsCount(ungradedCount);
        return;
      }
      const response = await apiClient('/assignments/ungraded-count');
      const result = await response.json();
      if (result.success && typeof result.data === 'number') {
        setUngradedAssignmentsCount(result.data);
      }
    } catch (error) {
      console.error('Failed to load ungraded assignments:', error);
    }
  }, [academyPaymentStatus]);

  const loadNewGrades = useCallback(async () => {
    try {
      const response = await apiClient('/assignments/new-grades-count');
      const result = await response.json();
      if (result.success && typeof result.data === 'number') {
        setNewGradesCount(result.data);
      }
    } catch (error) {
      console.error('Failed to load new grades:', error);
    }
  }, []);

  const loadUnpaidClasses = useCallback(async () => {
    try {
      const response = await apiClient('/classes');
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        const needsAction = result.data.filter((c: { paymentStatus?: string | null }) =>
          !c.paymentStatus
        );
        setUnpaidClassesCount(needsAction.length);
      }
    } catch (error) {
      console.error('Failed to load unpaid classes:', error);
    }
  }, []);

  const loadStudentPendingPayments = useCallback(async () => {
    try {
      const res = await apiClient('/payments/my-payments');
      const json = await res.json() as { success: boolean; data: Array<{ paymentStatus: string }> };
      if (json?.success && Array.isArray(json.data)) {
        const count = json.data.filter(p =>
          p.paymentStatus === 'PENDING' || p.paymentStatus === 'CASH_PENDING'
        ).length;
        setStudentPendingPaymentsCount(count);
      }
    } catch (error) {
      console.error('Failed to load student pending payments:', error);
    }
  }, []);

  useEffect(() => {
    const handlePaymentChange = () => { loadAcademy(); };
    window.addEventListener('pendingPaymentsChanged', handlePaymentChange);
    return () => window.removeEventListener('pendingPaymentsChanged', handlePaymentChange);
  }, [loadAcademy]);

  useEffect(() => {
    const handleFeedbackToggle = () => { loadAcademy(); };
    window.addEventListener('feedbackToggled', handleFeedbackToggle);
    return () => window.removeEventListener('feedbackToggled', handleFeedbackToggle);
  }, [loadAcademy]);

  useEffect(() => {
    const handleUnreadReviewsChanged = () => { loadUnreadValoraciones(); };
    window.addEventListener('unreadReviewsChanged', handleUnreadReviewsChanged);
    return () => window.removeEventListener('unreadReviewsChanged', handleUnreadReviewsChanged);
  }, [loadUnreadValoraciones]);

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await apiClient('/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });
      setNotifications(prev => prev.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const joinLiveClass = (notification: Notification) => {
    if (notification.data?.zoomLink) {
      markNotificationAsRead(notification.id);
      window.open(notification.data.zoomLink, '_blank');
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient('/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return {
    notifications, unreadCount, activeStreams,
    pendingPaymentsCount, unreadValoracionesCount, ungradedAssignmentsCount,
    newSubmissionsCount, newGradesCount, unpaidClassesCount, studentPendingPaymentsCount,
    academyId, academyPaymentStatus, academy,
    loadNotifications, loadActiveStreams, loadAcademy,
    loadUnreadValoraciones, loadUngradedAssignments,
    loadNewGrades, loadUnpaidClasses, loadStudentPendingPayments,
    markNotificationAsRead, joinLiveClass, markAllAsRead,
  };
}
