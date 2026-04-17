'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import { usePeriod } from '@/contexts/PeriodContext';
import { CctvIconHandle } from '@/components/icons/CctvIcon';
import {
  Academy, AcademicYear, ZoomAccount, StripeStatus, ProfileFormData,
  DEFAULT_ALLOWED_PAYMENT_METHODS, normalizeAllowedPaymentMethods,
} from './profile-types';

export function useProfileData() {
  const { user, refetch: refetchUser } = useAuth();
  const { activePeriodId, setActivePeriodId, isClassInPeriod } = usePeriod();
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [zoomAccounts, setZoomAccounts] = useState<ZoomAccount[]>([]);
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [streamingDropdownOpen, setStreamingDropdownOpen] = useState(false);
  const streamingDropdownRef = useRef<HTMLDivElement>(null);
  const streamingIconRef = useRef<CctvIconHandle>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [showAcademicYearModal, setShowAcademicYearModal] = useState(false);
  const [newYearData, setNewYearData] = useState({ name: '', startDate: '', endDate: '' });
  const [creatingYear, setCreatingYear] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [editYearData, setEditYearData] = useState({ name: '', startDate: '', endDate: '' });
  const [savingEditYear, setSavingEditYear] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [expandedPaymentMethod, setExpandedPaymentMethod] = useState<'transferencia' | 'bizum' | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [emailChangeStep, setEmailChangeStep] = useState<'idle' | 'sending' | 'confirming'>('idle');
  const [pendingEmailChange, setPendingEmailChange] = useState<string | null>(null);
  const [emailChangeCode, setEmailChangeCode] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '', address: '', phone: '', email: '',
    feedbackEnabled: true, defaultWatermarkIntervalMins: 5, defaultMaxWatchTimeMultiplier: 2.0,
    allowedPaymentMethods: [...DEFAULT_ALLOWED_PAYMENT_METHODS],
    transferenciaIban: '', bizumPhone: '', requireGrading: true, hiddenMenuItems: [],
  });

  const loadData = useCallback(async () => {
    try {
      const [academyRes, zoomRes, stripeRes, yearsRes] = await Promise.all([
        apiClient('/academies'), apiClient('/zoom-accounts'),
        apiClient('/payments/stripe-status'), apiClient('/academic-years'),
      ]);
      const [academyResult, zoomResult, stripeResult, yearsResult] = await Promise.all([
        academyRes.json(), zoomRes.json(), stripeRes.json(), yearsRes.json(),
      ]);

      if (academyResult.success && academyResult.data.length > 0) {
        const d = academyResult.data[0];
        setAcademy(d);
        const allowedMethods = normalizeAllowedPaymentMethods(d.allowedPaymentMethods);
        const stripeConnected = stripeResult.success && stripeResult.data?.charges_enabled === true;
        const cleanedMethods = stripeConnected
          ? (allowedMethods.includes('stripe') ? allowedMethods : [...allowedMethods, 'stripe'])
          : allowedMethods.filter((m) => m !== 'stripe');
        if (cleanedMethods.length !== allowedMethods.length || cleanedMethods.some((m, i) => m !== allowedMethods[i])) {
          apiClient(`/academies/${d.id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ allowedPaymentMethods: JSON.stringify(cleanedMethods) }),
          }).catch(() => {});
        }
        setFormData({
          name: d.name || '', address: d.address || '', phone: d.phone || '',
          email: (d.email as string | undefined) || user?.email || '',
          feedbackEnabled: d.feedbackEnabled !== 0,
          defaultWatermarkIntervalMins: d.defaultWatermarkIntervalMins ?? 5,
          defaultMaxWatchTimeMultiplier: d.defaultMaxWatchTimeMultiplier ?? 2.0,
          allowedPaymentMethods: cleanedMethods,
          transferenciaIban: d.transferenciaIban || 'ES', bizumPhone: d.bizumPhone || '',
          requireGrading: d.requireGrading !== 0,
          hiddenMenuItems: (() => { try { return JSON.parse(d.hiddenMenuItems || '[]'); } catch { return []; } })(),
        });
        setOriginalEmail((d.email as string | undefined) || user?.email || '');
      }
      if (zoomResult.success) setZoomAccounts(zoomResult.data || []);
      if (stripeResult.success) setStripeStatus(stripeResult.data);
      if (yearsResult.success) setAcademicYears(yearsResult.data || []);

      if (user?.email?.toLowerCase().includes('demo')) {
        setStripeStatus({ connected: true, charges_enabled: true, details_submitted: true, accountId: 'acct_1ABCdemoAkademo', email: 'demo@akademo.io' });
        if (!zoomResult.data || zoomResult.data.length === 0) {
          setZoomAccounts([{ id: 'zoom-demo-1', accountName: 'Academia Demo', accountId: 'demo_zoom_001', createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), classes: [] }]);
        }
        if (!yearsResult.data || yearsResult.data.length === 0) {
          setAcademicYears([{ id: 'year-demo-1', academyId: 'demo', name: '2024-2025', startDate: '2024-09-01', endDate: '2025-06-30', isCurrent: 1, createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString() }]);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('zoom') === 'connected' || params.get('gtm') === 'connected';
    if (!connected) return;
    const _end = Date.now() + 3 * 1000;
    const _colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];
    const _frame = () => {
      if (Date.now() > _end) return;
      confetti({ particleCount: 2, angle: 60, spread: 55, startVelocity: 60, origin: { x: 0, y: 0.5 }, colors: _colors });
      confetti({ particleCount: 2, angle: 120, spread: 55, startVelocity: 60, origin: { x: 1, y: 0.5 }, colors: _colors });
      requestAnimationFrame(_frame);
    };
    _frame();
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('zoom'); cleanUrl.searchParams.delete('gtm');
    window.history.replaceState({}, '', cleanUrl.toString());
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripeParam = params.get('stripe');
    if (!stripeParam) return;
    if (stripeParam === 'complete') {
      const _end2 = Date.now() + 3 * 1000;
      const _colors2 = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];
      const _frame2 = () => {
        if (Date.now() > _end2) return;
        confetti({ particleCount: 2, angle: 60, spread: 55, startVelocity: 60, origin: { x: 0, y: 0.5 }, colors: _colors2 });
        confetti({ particleCount: 2, angle: 120, spread: 55, startVelocity: 60, origin: { x: 1, y: 0.5 }, colors: _colors2 });
        requestAnimationFrame(_frame2);
      };
      _frame2();
    }
    loadData();
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('stripe');
    window.history.replaceState({}, '', cleanUrl.toString());
  }, [loadData]);

  useEffect(() => {
    if (!streamingDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (streamingDropdownRef.current && !streamingDropdownRef.current.contains(e.target as Node))
        setStreamingDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [streamingDropdownOpen]);

  return {
    user, academy, setAcademy, zoomAccounts, setZoomAccounts,
    stripeStatus, setStripeStatus, loading,
    streamingDropdownOpen, setStreamingDropdownOpen, streamingDropdownRef, streamingIconRef,
    academicYears, setAcademicYears, showAcademicYearModal, setShowAcademicYearModal,
    newYearData, setNewYearData, creatingYear, setCreatingYear,
    editingYear, setEditingYear, editYearData, setEditYearData, savingEditYear, setSavingEditYear,
    saving, setSaving, editing, setEditing,
    expandedPaymentMethod, setExpandedPaymentMethod,
    uploadingLogo, setUploadingLogo, connectingStripe, setConnectingStripe,
    passwordData, setPasswordData, showPasswordForm, setShowPasswordForm,
    emailChangeStep, setEmailChangeStep, pendingEmailChange, setPendingEmailChange,
    emailChangeCode, setEmailChangeCode, originalEmail, setOriginalEmail, originalEmail, setOriginalEmail,
    formData, setFormData, loadData, refetchUser,
    activePeriodId, setActivePeriodId, isClassInPeriod,
  };
}

export type ProfileState = ReturnType<typeof useProfileData>;
