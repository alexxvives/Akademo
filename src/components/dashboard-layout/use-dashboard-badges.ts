'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { generateDemoPendingPayments } from '@/lib/demo-data';
import type { ActiveStream, Academy } from './types';

export function useDashboardBadges() {
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

  const controllerRef = useRef<AbortController>(new AbortController());
  // Throttle: don't re-fetch active streams more than once per 60 seconds
  const lastActiveStreamsFetchRef = useRef<number>(0);

  const loadActiveStreams = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastActiveStreamsFetchRef.current < 60_000) return;
    lastActiveStreamsFetchRef.current = now;
    try {
      const response = await apiClient('/live/active', { signal: controllerRef.current.signal });
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setActiveStreams(result.data);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('Failed to load active streams:', error);
    }
  }, []);

  const loadAcademy = useCallback(async (): Promise<string> => {
    try {
      const academyResponse = await apiClient('/academies', { signal: controllerRef.current.signal });
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
          const pendingRes = await apiClient('/payments/pending-count', { signal: controllerRef.current.signal });
          const pendingResult = await pendingRes.json();
          if (pendingResult.success && typeof pendingResult.data === 'number') {
            setPendingPaymentsCount(pendingResult.data);
          }
        }
        return paymentStatus;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'PAID';
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
      const response = await apiClient('/lessons/ratings/unread-count', { signal: controllerRef.current.signal });
      const result = await response.json();
      if (result.success && result.data) {
        setUnreadValoracionesCount(result.data.count || 0);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
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
      const response = await apiClient('/assignments/ungraded-count', { signal: controllerRef.current.signal });
      const result = await response.json();
      if (result.success && typeof result.data === 'number') {
        setUngradedAssignmentsCount(result.data);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('Failed to load ungraded assignments:', error);
    }
  }, [academyPaymentStatus]);

  const loadNewGrades = useCallback(async () => {
    try {
      const response = await apiClient('/assignments/new-grades-count', { signal: controllerRef.current.signal });
      const result = await response.json();
      if (result.success && typeof result.data === 'number') {
        setNewGradesCount(result.data);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('Failed to load new grades:', error);
    }
  }, []);

  const loadUnpaidClasses = useCallback(async () => {
    try {
      const response = await apiClient('/classes', { signal: controllerRef.current.signal });
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        const needsAction = result.data.filter((c: { paymentStatus?: string | null }) =>
          !c.paymentStatus
        );
        setUnpaidClassesCount(needsAction.length);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('Failed to load unpaid classes:', error);
    }
  }, []);

  const loadStudentPendingPayments = useCallback(async () => {
    try {
      const res = await apiClient('/payments/my-payments', { signal: controllerRef.current.signal });
      const json = await res.json() as { success: boolean; data: Array<{ paymentStatus: string }> };
      if (json?.success && Array.isArray(json.data)) {
        const count = json.data.filter(p =>
          p.paymentStatus === 'PENDING' || p.paymentStatus === 'CASH_PENDING'
        ).length;
        setStudentPendingPaymentsCount(count);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('Failed to load student pending payments:', error);
    }
  }, []);

  const loadPendingPaymentsCount = useCallback(async () => {
    try {
      const res = await apiClient('/payments/pending-count', { signal: controllerRef.current.signal });
      const result = await res.json();
      if (result.success && typeof result.data === 'number') {
        setPendingPaymentsCount(result.data);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('Failed to load pending payments count:', error);
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

  return {
    activeStreams,
    pendingPaymentsCount, unreadValoracionesCount, ungradedAssignmentsCount,
    newSubmissionsCount, newGradesCount, unpaidClassesCount, studentPendingPaymentsCount,
    academyId, academyPaymentStatus, academy,
    loadActiveStreams, loadAcademy,
    loadUnreadValoraciones, loadUngradedAssignments,
    loadNewGrades, loadUnpaidClasses, loadStudentPendingPayments, loadPendingPaymentsCount,
    cleanup,
  };

  function cleanup() {
    controllerRef.current.abort();
    controllerRef.current = new AbortController();
  }
}
