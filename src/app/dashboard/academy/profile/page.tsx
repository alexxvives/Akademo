'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import { refreshAcademyLogo } from '@/hooks/useAcademyLogo';
import { SkeletonProfile } from '@/components/ui/SkeletonLoader';
import { PasswordInput } from '@/components/ui';
import { ModalPortal } from '@/components/ui/ModalPortal';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { StripeConnectButton } from '@/components/profile';
import { CctvIcon, CctvIconHandle } from '@/components/icons/CctvIcon';
import { usePeriod } from '@/contexts/PeriodContext';

interface ZoomAccount {
  id: string;
  accountName: string;
  accountId: string;
  provider?: string;
  createdAt: string;
  classes?: Array<{
    id: string;
    name: string;
    startDate?: string | null;
  }>;
}

interface StripeStatus {
  connected: boolean;
  charges_enabled: boolean;
  details_submitted: boolean;
  accountId?: string;
  email?: string;
}

interface Academy {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  address?: string;
  phone?: string;
  email?: string;
  feedbackEnabled?: number;
  defaultWatermarkIntervalMins?: number;
  defaultMaxWatchTimeMultiplier?: number;
  logoUrl?: string;
  allowedPaymentMethods?: string;
  transferenciaIban?: string;
  bizumPhone?: string;
  allowMultipleTeachers?: number;
  requireGrading?: number;
  hiddenMenuItems?: string;
  restrictStreamAccess?: number;
}

interface AcademicYear {
  id: string;
  academyId: string;
  name: string;
  startDate: string;
  endDate?: string | null;
  isCurrent: number;
  createdAt: string;
}

const WATERMARK_OPTIONS = [
  { value: 1, label: '1 minuto' },
  { value: 3, label: '3 minutos' },
  { value: 5, label: '5 minutos' },
  { value: 10, label: '10 minutos' },
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' }
];

const MULTIPLIER_OPTIONS = [
  { value: 1.0, label: '1x (una vez)' },
  { value: 1.5, label: '1.5x' },
  { value: 2.0, label: '2x (dos veces)' },
  { value: 2.5, label: '2.5x' },
  { value: 3.0, label: '3x (tres veces)' },
  { value: 5.0, label: '5x (cinco veces)' },
  { value: 10.0, label: '10x (ilimitado)' }
];

const DEFAULT_ALLOWED_PAYMENT_METHODS = ['cash'];
const SUPPORTED_PAYMENT_METHODS = ['stripe', 'cash', 'transferencia', 'bizum'] as const;

function normalizeAllowedPaymentMethods(value?: string | string[] | null): string[] {
  let methods: string[] = [...DEFAULT_ALLOWED_PAYMENT_METHODS];

  if (Array.isArray(value)) {
    methods = value;
  } else if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        methods = parsed;
      }
    } catch (error) {
      console.error('Failed to parse allowedPaymentMethods:', error);
    }
  }

  const filtered = methods.filter((method): method is string =>
    (SUPPORTED_PAYMENT_METHODS as readonly string[]).includes(method)
  );

  if (filtered.length === 0) {
    return [...DEFAULT_ALLOWED_PAYMENT_METHODS];
  }

  return [...SUPPORTED_PAYMENT_METHODS].filter((method) => filtered.includes(method));
}

function formatSpanishIbanInput(value: string): string {
  const sanitized = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const core = (sanitized.startsWith('ES') ? sanitized.slice(2) : sanitized.replace(/^[A-Z]{0,2}/, ''))
    .replace(/[^0-9]/g, '')
    .slice(0, 22);
  const full = `ES${core}`;
  return full.match(/.{1,4}/g)?.join(' ') ?? full;
}

function isValidSpanishIban(value: string): boolean {
  return /^ES\d{22}$/.test(value.replace(/\s+/g, ''));
}

function formatSpanishBizumPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  const localNumber = (digits.startsWith('34') ? digits.slice(2) : digits).slice(0, 9);
  if (!localNumber) return '';
  const groups = localNumber.match(/\d{1,3}/g)?.join(' ') ?? localNumber;
  return `+34 ${groups}`;
}

function isValidSpanishBizumPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  const localNumber = digits.startsWith('34') ? digits.slice(2) : digits;
  return /^[6789]\d{8}$/.test(localNumber);
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { activePeriodId, setActivePeriodId, isClassInPeriod } = usePeriod();
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [zoomAccounts, setZoomAccounts] = useState<ZoomAccount[]>([]);
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [streamingDropdownOpen, setStreamingDropdownOpen] = useState(false);
  const streamingDropdownRef = useRef<HTMLDivElement>(null);
  const streamingIconRef = useRef<CctvIconHandle>(null);
  const stripePollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stripePollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    feedbackEnabled: true,
    defaultWatermarkIntervalMins: 5,
    defaultMaxWatchTimeMultiplier: 2.0,
    allowedPaymentMethods: [...DEFAULT_ALLOWED_PAYMENT_METHODS],
    transferenciaIban: '',
    bizumPhone: '',
    allowMultipleTeachers: false,
    requireGrading: true,
    hiddenMenuItems: [] as string[],
    restrictStreamAccess: false
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('zoom') === 'connected' || params.get('gtm') === 'connected';
    if (!connected) return;
    confetti({ particleCount: 180, spread: 100, origin: { y: 0.55 } });
    setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { x: 0.1, y: 0.6 } }), 200);
    setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { x: 0.9, y: 0.6 } }), 400);
    // Clean URL so confetti doesn't re-fire on refresh
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('zoom');
    cleanUrl.searchParams.delete('gtm');
    window.history.replaceState({}, '', cleanUrl.toString());
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [academyRes, zoomRes, stripeRes, yearsRes] = await Promise.all([
        apiClient('/academies'),
        apiClient('/zoom-accounts'),
        apiClient('/payments/stripe-status'),
        apiClient('/academic-years'),
      ]);

      const academyResult = await academyRes.json();
      const zoomResult = await zoomRes.json();
      const stripeResult = await stripeRes.json();
      const yearsResult = await yearsRes.json();

      if (academyResult.success && academyResult.data.length > 0) {
        const academyData = academyResult.data[0];
        setAcademy(academyData);
        
        const allowedMethods = normalizeAllowedPaymentMethods(academyData.allowedPaymentMethods);
        // Auto-remove stripe if the academy hasn't connected a working Stripe account
        const stripeConnected = stripeResult.success && stripeResult.data?.charges_enabled === true;
        const cleanedMethods = stripeConnected ? allowedMethods : allowedMethods.filter((m) => m !== 'stripe');
        // If we removed stripe, persist the change to DB silently
        if (!stripeConnected && allowedMethods.includes('stripe')) {
          apiClient(`/academies/${academyData.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ allowedPaymentMethods: JSON.stringify(cleanedMethods) }),
          }).catch(() => {});
        }
        
        setFormData({
          name: academyData.name || '',
          address: academyData.address || '',
          phone: academyData.phone || '',
          email: academyData.email || user?.email || '',
          feedbackEnabled: academyData.feedbackEnabled !== 0,
          defaultWatermarkIntervalMins: academyData.defaultWatermarkIntervalMins || 5,
          defaultMaxWatchTimeMultiplier: academyData.defaultMaxWatchTimeMultiplier || 2.0,
          allowedPaymentMethods: cleanedMethods,
          transferenciaIban: academyData.transferenciaIban || 'ES',
          bizumPhone: academyData.bizumPhone || '',
          allowMultipleTeachers: academyData.allowMultipleTeachers === 1,
          requireGrading: academyData.requireGrading !== 0,
          hiddenMenuItems: (() => { try { return JSON.parse(academyData.hiddenMenuItems || '[]'); } catch { return []; } })(),
          restrictStreamAccess: academyData.restrictStreamAccess === 1
        });
      }

      if (zoomResult.success) {
        setZoomAccounts(zoomResult.data || []);
      }

      if (stripeResult.success) {
        setStripeStatus(stripeResult.data);
      }

      if (yearsResult.success) {
        setAcademicYears(yearsResult.data || []);
      }

      // Inject fake connected state for demo users
      if (user?.email?.toLowerCase().includes('demo')) {
        setStripeStatus({
          connected: true,
          charges_enabled: true,
          details_submitted: true,
          accountId: 'acct_1ABCdemoAkademo',
          email: 'demo@akademo.io',
        });
        if (!zoomResult.data || zoomResult.data.length === 0) {
          setZoomAccounts([{
            id: 'zoom-demo-1',
            accountName: 'Academia Demo',
            accountId: 'demo_zoom_001',
            createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
            classes: [],
          }]);
        }
        if (!yearsResult.data || yearsResult.data.length === 0) {
          setAcademicYears([{
            id: 'year-demo-1',
            academyId: 'demo',
            name: '2024-2025',
            startDate: '2024-09-01',
            endDate: '2025-06-30',
            isCurrent: 1,
            createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
          }]);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cleanup Stripe polling on unmount
  useEffect(() => {
    return () => {
      if (stripePollRef.current) clearInterval(stripePollRef.current);
      if (stripePollTimeoutRef.current) clearTimeout(stripePollTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!streamingDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (streamingDropdownRef.current && !streamingDropdownRef.current.contains(e.target as Node)) {
        setStreamingDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [streamingDropdownOpen]);

  const handleConnectZoom = () => {
    // Navigate in same tab so the callback redirects back here
    const clientId = 'W2jPo9CJR0uZbFnEWtBF7Q';
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/zoom/oauth/callback`);
    const state = academy?.id || '';
    window.location.href = `https://zoom.us/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;
  };

  const handleConnectGTM = async () => {
    try {
      const response = await apiClient('/zoom-accounts/gtm-connect-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academyId: academy?.id || '' })
      });
      const result = await response.json();
      if (result.success && result.data?.url) {
        window.location.href = result.data.url;
      }
    } catch (error) {
      console.error('Error connecting GoToMeeting:', error);
      alert('Error al conectar GoToMeeting');
    }
  };

  const handleDisconnectZoom = async (accountId: string) => {
    if (!confirm('¿Estás seguro de que deseas desconectar esta cuenta de Zoom?')) {
      return;
    }

    try {
      const response = await apiClient(`/zoom-accounts/${accountId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setZoomAccounts(zoomAccounts.filter(acc => acc.id !== accountId));
      }
    } catch (error) {
      console.error('Error disconnecting Zoom:', error);
      alert('Error al desconectar la cuenta de Zoom');
    }
  };

  const handleConnectStripe = async () => {
    try {
      const response = await apiClient('/payments/stripe-connect', {
        method: 'POST'
      });

      const result = await response.json();

      if (result.success && result.data?.url) {
        // Open Stripe onboarding in new window
        window.open(result.data.url, '_blank');
        
        // Set up polling to check status when user returns
        if (stripePollRef.current) clearInterval(stripePollRef.current);
        if (stripePollTimeoutRef.current) clearTimeout(stripePollTimeoutRef.current);
        stripePollRef.current = setInterval(async () => {
          if (!document.hidden) {
            const statusRes = await apiClient('/payments/stripe-status');
            const statusResult = await statusRes.json();
            
            if (statusResult.success && statusResult.data?.charges_enabled) {
              setStripeStatus(statusResult.data);
              if (stripePollRef.current) clearInterval(stripePollRef.current);
              stripePollRef.current = null;
            }
          }
        }, 3000);

        // Stop polling after 5 minutes
        stripePollTimeoutRef.current = setTimeout(() => {
          if (stripePollRef.current) clearInterval(stripePollRef.current);
          stripePollRef.current = null;
        }, 300000);
      } else {
        alert('Error al conectar con Stripe: ' + (result.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error connecting Stripe:', error);
      alert('Error al conectar con Stripe');
    }
  };

  const handleCreateAcademicYear = async () => {
    if (!newYearData.name.trim() || !newYearData.startDate) return;
    setCreatingYear(true);
    try {
      const res = await apiClient('/academic-years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newYearData.name.trim(),
          startDate: newYearData.startDate,
          endDate: newYearData.endDate || null,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setAcademicYears(result.data || []);
        setShowAcademicYearModal(false);
        setNewYearData({ name: '', startDate: '', endDate: '' });
      } else {
        alert('Error al crear el período: ' + (result.error || 'Error desconocido'));
      }
    } catch (e) {
      console.error('Error creating academic period:', e);
      alert('Error de conexión al crear el período');
    } finally {
      setCreatingYear(false);
    }
  };

  const handleSetCurrentPeriod = async (periodId: string) => {
    try {
      const res = await apiClient(`/academic-years/${periodId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCurrent: 1 }),
      });
      const result = await res.json();
      if (result.success) {
        setAcademicYears(result.data || []);
        setActivePeriodId(periodId);
      }
    } catch (e) {
      console.error('Error switching period:', e);
    }
  };

  const handleEditAcademicYear = async () => {
    if (!editingYear || !editYearData.name.trim() || !editYearData.startDate) return;
    setSavingEditYear(true);
    try {
      const res = await apiClient(`/academic-years/${editingYear.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editYearData.name.trim(),
          startDate: editYearData.startDate,
          endDate: editYearData.endDate || null,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setAcademicYears(result.data || []);
        setEditingYear(null);
      } else {
        alert('Error al editar el período: ' + (result.error || 'Error desconocido'));
      }
    } catch (e) {
      console.error('Error editing academic period:', e);
      alert('Error de conexión al editar el período');
    } finally {
      setSavingEditYear(false);
    }
  };

  type SettingField = keyof typeof formData;
  type SettingValue = string | number | boolean | string[];

  const handleSettingChange = async (field: SettingField, value: SettingValue) => {
    if (!academy) return;


    // For allowedPaymentMethods, value is a JSON string but we need an array for the state
    const stateValue = field === 'allowedPaymentMethods'
      ? (JSON.parse(String(value)) as string[])
      : value;
    
    // Update local state immediately
    const newFormData = { ...formData, [field]: stateValue };
    setFormData(newFormData);


    // Save to database immediately with ALL current values
    try {
      const body = {
        name: newFormData.name,
        address: newFormData.address,
        phone: newFormData.phone,
        email: newFormData.email,
        feedbackEnabled: field === 'feedbackEnabled' ? value : (newFormData.feedbackEnabled ? 1 : 0),
        defaultWatermarkIntervalMins: newFormData.defaultWatermarkIntervalMins,
        defaultMaxWatchTimeMultiplier: newFormData.defaultMaxWatchTimeMultiplier,
        allowedPaymentMethods: field === 'allowedPaymentMethods' ? value : JSON.stringify(newFormData.allowedPaymentMethods),
        transferenciaIban: field === 'transferenciaIban' ? value : newFormData.transferenciaIban,
        bizumPhone: field === 'bizumPhone' ? value : newFormData.bizumPhone,
        allowMultipleTeachers: field === 'allowMultipleTeachers' ? value : (newFormData.allowMultipleTeachers ? 1 : 0),
        requireGrading: field === 'requireGrading' ? value : (newFormData.requireGrading ? 1 : 0),
        hiddenMenuItems: field === 'hiddenMenuItems' ? JSON.stringify(value) : JSON.stringify(newFormData.hiddenMenuItems),
        restrictStreamAccess: field === 'restrictStreamAccess' ? value : (newFormData.restrictStreamAccess ? 1 : 0)
      };


      const response = await apiClient(`/academies/${academy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const result = await response.json();
      
      if (result.success) {
        // If feedback was toggled, dispatch event for DashboardLayout to update sidebar
        if (field === 'feedbackEnabled') {
          window.dispatchEvent(new CustomEvent('feedbackToggled', { 
            detail: { feedbackEnabled: value } 
          }));
        }
        // If requireGrading was toggled, dispatch event for DashboardLayout to update sidebar
        if (field === 'requireGrading') {
          window.dispatchEvent(new CustomEvent('feedbackToggled', { 
            detail: { requireGrading: value } 
          }));
        }
        // If menu items changed, reload sidebar
        if (field === 'hiddenMenuItems') {
          window.dispatchEvent(new CustomEvent('feedbackToggled'));
        }
      } else {
        console.error('Error updating setting:', result);
        alert('Error al actualizar la configuración');
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      alert('Error al actualizar la configuración');
    }
  };

  const handleSaveProfile = async () => {
    if (!academy) return;

    setSaving(true);
    try {
      const response = await apiClient(`/academies/${academy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          feedbackEnabled: formData.feedbackEnabled ? 1 : 0,
          defaultWatermarkIntervalMins: formData.defaultWatermarkIntervalMins,
          defaultMaxWatchTimeMultiplier: formData.defaultMaxWatchTimeMultiplier,
          allowedPaymentMethods: JSON.stringify(formData.allowedPaymentMethods),
          transferenciaIban: formData.transferenciaIban,
          bizumPhone: formData.bizumPhone,
          allowMultipleTeachers: formData.allowMultipleTeachers ? 1 : 0,
          requireGrading: formData.requireGrading ? 1 : 0,
          hiddenMenuItems: JSON.stringify(formData.hiddenMenuItems)
        })
      });

      const result = await response.json();
      if (result.success) {
        setEditing(false);
        await loadData();
        // Update sidebar academy name immediately
        refreshAcademyLogo();
      } else {
        alert('Error al guardar los cambios');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!academy || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    
    // Validate image types (SVG, PNG, JPG)
    const validTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('Solo se permiten archivos SVG, PNG o JPG');
      return;
    }

    // Validate size (max 500KB)
    if (file.size > 500 * 1024) {
      alert('El logo debe ser menor a 500KB');
      return;
    }

    setUploadingLogo(true);
    try {
      // Derive a safe filename from email: academy1@gmail.com → academy1.png
      const ownerEmail = academy.email || user?.email || '';
      const username = ownerEmail.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '_') || academy.id;
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const safeFileName = `${username}.${ext}`;

      // Upload to R2
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', `academy-logos/${academy.id}/${safeFileName}`);

      const uploadRes = await apiClient('/storage/upload', {
        method: 'POST',
        body: formData
      });

      const uploadResult = await uploadRes.json();
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      // Update academy with logoUrl (use path from upload response)
      const logoPath = uploadResult.data.path;
      const updateRes = await apiClient(`/academies/${academy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl: logoPath })
      });

      const updateResult = await updateRes.json();
      if (updateResult.success) {
        await loadData();
        // Update sidebar logo immediately without page reload
        refreshAcademyLogo();
      } else {
        throw new Error('Failed to update academy');
      }
    } catch (error: unknown) {
      console.error('Error uploading logo:', error);
      alert('Error al subir el logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    alert('Funcionalidad en desarrollo');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswordForm(false);
  };

  const toggleAllowedPaymentMethod = async (method: 'stripe' | 'cash' | 'transferencia' | 'bizum') => {
    if (method === 'transferencia' || method === 'bizum') {
      const isActive = formData.allowedPaymentMethods.includes(method);

      if (isActive) {
        // Already active → deactivate immediately, no input
        if (formData.allowedPaymentMethods.length === 1) {
          alert('Debes tener al menos un método de pago habilitado');
          return;
        }
        setExpandedPaymentMethod(null);
        const updated = formData.allowedPaymentMethods.filter((m) => m !== method);
        await handleSettingChange('allowedPaymentMethods', JSON.stringify(updated));
        return;
      }

      // Inactive → toggle the input open/closed
      if (expandedPaymentMethod === method) {
        setExpandedPaymentMethod(null);
        setFormData((current) => ({
          ...current,
          transferenciaIban: academy?.transferenciaIban || 'ES',
          bizumPhone: academy?.bizumPhone || '',
        }));
        return;
      }

      setExpandedPaymentMethod(method);
      return;
    }

    const currentMethods = Array.isArray(formData.allowedPaymentMethods) ? formData.allowedPaymentMethods : [];
    const hasMethod = currentMethods.includes(method);

    if (!hasMethod) {
      if (method === 'stripe' && !stripeStatus?.charges_enabled) {
        alert('Debes conectar una cuenta de Stripe antes de habilitar pagos con Stripe');
        return;
      }
    }

    if (hasMethod && currentMethods.length === 1) {
      alert('Debes tener al menos un método de pago habilitado');
      return;
    }

    const updated = hasMethod
      ? currentMethods.filter((currentMethod) => currentMethod !== method)
      : [...currentMethods, method];

    await handleSettingChange('allowedPaymentMethods', JSON.stringify(updated));

  };

  const saveTransferenciaSetup = async () => {
    const normalizedIban = formatSpanishIbanInput(formData.transferenciaIban);

    if (!isValidSpanishIban(normalizedIban)) {
      alert('Introduce un IBAN español válido antes de guardar Transferencia');
      return;
    }

    setFormData((current) => ({ ...current, transferenciaIban: normalizedIban }));
    setExpandedPaymentMethod(null);
    await handleSettingChange('transferenciaIban', normalizedIban);

    if (!formData.allowedPaymentMethods.includes('transferencia')) {
      await handleSettingChange(
        'allowedPaymentMethods',
        JSON.stringify([...formData.allowedPaymentMethods, 'transferencia'])
      );
    }
  };

  const saveBizumSetup = async () => {
    const normalizedPhone = formatSpanishBizumPhone(formData.bizumPhone);

    if (!isValidSpanishBizumPhone(normalizedPhone)) {
      alert('Introduce un teléfono español válido antes de guardar Bizum');
      return;
    }

    setFormData((current) => ({ ...current, bizumPhone: normalizedPhone }));
    setExpandedPaymentMethod(null);
    await handleSettingChange('bizumPhone', normalizedPhone);

    if (!formData.allowedPaymentMethods.includes('bizum')) {
      await handleSettingChange(
        'allowedPaymentMethods',
        JSON.stringify([...formData.allowedPaymentMethods, 'bizum'])
      );
    }
  };

  const isTransferenciaExpanded = expandedPaymentMethod === 'transferencia';
  const isBizumExpanded = expandedPaymentMethod === 'bizum';

  if (loading) {
    return <SkeletonProfile />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Configuración</h1>
          <p className="text-sm text-gray-600 mt-1">Administra la información y preferencias de tu academia</p>
        </div>
      </div>

      {/* Academy Info Card */}
      {academy && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Card Header */}
          <div className="px-4 sm:px-8 py-4 sm:py-6 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Información General</h2>
                <p className="text-sm text-gray-600 mt-1">Datos principales de tu academia</p>
              </div>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        name: academy.name || '',
                        address: academy.address || '',
                        phone: academy.phone || '',
                        email: academy.email || user?.email || '',
                        feedbackEnabled: academy.feedbackEnabled !== 0,
                        defaultWatermarkIntervalMins: academy.defaultWatermarkIntervalMins || 5,
                        defaultMaxWatchTimeMultiplier: academy.defaultMaxWatchTimeMultiplier || 2.0,
                        allowedPaymentMethods: normalizeAllowedPaymentMethods(academy.allowedPaymentMethods),
                        transferenciaIban: academy.transferenciaIban || 'ES',
                        bizumPhone: academy.bizumPhone || '',
                        allowMultipleTeachers: academy.allowMultipleTeachers === 1,
                        requireGrading: academy.requireGrading !== 0,
                        hiddenMenuItems: (() => { try { return JSON.parse(academy.hiddenMenuItems || '[]'); } catch { return []; } })(),
                        restrictStreamAccess: academy.restrictStreamAccess === 1
                      });
                    }}
                    disabled={saving}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-all font-medium text-sm disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Guardar cambios
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card Body */}
          <div className="px-4 sm:px-8 py-4 sm:py-6">
            {/* Nombre y Logo - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-200">
              {/* Nombre de la academia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la academia
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                    placeholder="Ej: Academia de Matemáticas Avanzadas"
                  />
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-gray-900 font-medium">{academy.name}</span>
                  </div>
                )}
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                  Logo de la academia
                </label>
                <div className="flex items-center justify-center gap-3">
                  {academy.logoUrl ? (
                    <div className="relative w-16 h-16 group flex-shrink-0">
                      <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                        <Image
                          src={`/api/storage/serve/${academy.logoUrl}`}
                          alt="Logo"
                          width={64}
                          height={64}
                          className="w-full h-full object-contain"
                          unoptimized
                        />
                      </div>
                      <button
                        onClick={async () => {
                          if (confirm('¿Estás seguro de que quieres eliminar el logo?')) {
                            try {
                              const token = localStorage.getItem('auth_token') || '';
                              const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/academies/${academy.id}`, {
                                method: 'PATCH',
                                credentials: 'include',
                                headers: {
                                  'Content-Type': 'application/json',
                                  ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                                },
                                body: JSON.stringify({ logoUrl: null }),
                              });
                              if (response.ok) {
                                setAcademy({ ...academy, logoUrl: undefined });
                                refreshAcademyLogo();
                              } else {
                                const errorData = await response.json();
                                alert(`Error: ${errorData.error || 'Error al eliminar el logo'}`);
                              }
                            } catch (error) {
                              alert('Error al eliminar el logo');
                            }
                          }
                        }}
                        className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                        title="Eliminar logo"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 border border-gray-300 border-dashed rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm">
                      <input
                        type="file"
                        accept="image/svg+xml,image/png,image/jpeg,image/jpg"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                        className="hidden"
                      />
                      {uploadingLogo ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent"></div>
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          {academy.logoUrl ? 'Cambiar' : 'Subir logo'}
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                {editing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm"
                    placeholder="contacto@academia.com"
                  />
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-900 text-sm truncate">{academy.email || user?.email || 'No especificado'}</span>
                  </div>
                )}
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                {editing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm"
                    placeholder="+34 123 456 789"
                  />
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-gray-900 text-sm">{academy.phone || 'No especificado'}</span>
                  </div>
                )}
              </div>

              {/* Dirección */}
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección <span className="text-xs text-gray-500">(efectivo)</span>
                </label>
                {editing ? (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm"
                      placeholder="Calle Principal 123"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-900 text-sm truncate">{academy.address || 'No especificada'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Cards - Side by Side */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-8 py-5 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {/* Removed icon next to Configuración Avanzada */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Configuración Avanzada</h3>
              <p className="text-sm text-gray-600">Feedback y reproducción de videos</p>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-8 py-4 sm:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-4 gap-x-8">
            {/* Feedback Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Habilitar feedback
                </label>
                <p className="text-xs text-gray-500">Permitir valoraciones de estudiantes en las clases</p>
              </div>
              <div className="flex items-center gap-3 ml-4 shrink-0">
                <button
                  onClick={() => handleSettingChange('feedbackEnabled', formData.feedbackEnabled ? 0 : 1)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${
                    formData.feedbackEnabled ? 'bg-brand-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                      formData.feedbackEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Watermark Interval */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Marca de agua
                </label>
                <p className="text-xs text-gray-500">Frecuencia de aparición</p>
              </div>
              <div className="ml-4 shrink-0 w-32">
                <select
                  value={formData.defaultWatermarkIntervalMins}
                  onChange={(e) => handleSettingChange('defaultWatermarkIntervalMins', parseInt(e.target.value))}
                  className="block w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm bg-white appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNSA3LjVMMTAgMTIuNUwxNSA3LjUiIHN0cm9rZT0iIzZCNzI4MCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==')] bg-no-repeat bg-[position:right_0.5rem_center]"
                >
                  {WATERMARK_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Restrict Stream Access */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Restricción de acceso a streams
                </label>
                <p className="text-xs text-gray-500">Solo estudiantes matriculados pueden unirse. Sin email o sin matrícula = acceso bloqueado</p>
              </div>
              <div className="flex items-center gap-3 ml-4 shrink-0">
                <button
                  onClick={() => handleSettingChange('restrictStreamAccess', formData.restrictStreamAccess ? 0 : 1)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${
                    formData.restrictStreamAccess ? 'bg-brand-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                      formData.restrictStreamAccess ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Watch Time Multiplier */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Límite de visualización
                </label>
                <p className="text-xs text-gray-500">Veces que puede ver el contenido</p>
              </div>
              <div className="ml-4 shrink-0 w-32">
                <select
                  value={formData.defaultMaxWatchTimeMultiplier}
                  onChange={(e) => handleSettingChange('defaultMaxWatchTimeMultiplier', parseFloat(e.target.value))}
                  className="block w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm bg-white appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNSA3LjVMMTAgMTIuNUwxNSA3LjUiIHN0cm9rZT0iIzZCNzI4MCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==')] bg-no-repeat bg-[position:right_0.5rem_center]"
                >
                  {MULTIPLIER_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Require Grading */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Calificación obligatoria
                </label>
                <p className="text-xs text-gray-500">Requiere que los profesores califiquen los ejercicios</p>
              </div>
              <div className="flex items-center gap-3 ml-4 shrink-0">
                <button
                  onClick={() => handleSettingChange('requireGrading', formData.requireGrading ? 0 : 1)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${
                    formData.requireGrading ? 'bg-brand-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                      formData.requireGrading ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Menu Configuration */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-8 py-5 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Menú lateral</h3>
          <p className="text-sm text-gray-600">Personaliza las opciones visibles en el menú lateral de la academia</p>
        </div>
        <div className="px-4 sm:px-8 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Valoraciones', description: 'Valoraciones de estudiantes' },
              { label: 'Streams', description: 'Clases en vivo por Zoom' },
              { label: 'Ejercicios', description: 'Gestión de ejercicios y entregas' },
              { label: 'Calificaciones', description: 'Sistema de calificaciones' },
            ].map(item => {
              const isHidden = formData.hiddenMenuItems.includes(item.label);
              return (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-500 truncate">{item.description}</p>
                  </div>
                  <button
                    onClick={() => {
                      const newHidden = isHidden
                        ? formData.hiddenMenuItems.filter((l: string) => l !== item.label)
                        : [...formData.hiddenMenuItems, item.label];
                      handleSettingChange('hiddenMenuItems', newHidden);
                    }}
                    className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors cursor-pointer flex-shrink-0 ml-3 ${
                      !isHidden ? 'bg-brand-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      !isHidden ? 'translate-x-5' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-8 py-5 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Métodos de Pago Permitidos</h3>
              <p className="text-sm text-gray-600">Selecciona los métodos de pago que aceptará tu academia</p>
            </div>
            {formData.allowedPaymentMethods.length === 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-800 font-medium">Debes seleccionar al menos un método de pago</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 sm:px-8 py-4 sm:py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
            <div
              role={stripeStatus?.charges_enabled ? 'button' : undefined}
              tabIndex={stripeStatus?.charges_enabled ? 0 : -1}
              onClick={stripeStatus?.charges_enabled ? () => toggleAllowedPaymentMethod('stripe') : undefined}
              onKeyDown={stripeStatus?.charges_enabled ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  void toggleAllowedPaymentMethod('stripe');
                }
              } : undefined}
              className={`p-4 border-2 rounded-xl transition-all duration-200 ${
              !stripeStatus?.charges_enabled
                ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                : formData.allowedPaymentMethods.includes('stripe')
                  ? 'border-violet-500 bg-violet-50 shadow-md cursor-pointer'
                  : 'border-gray-200 bg-white cursor-pointer'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={`text-sm font-semibold mb-1 ${formData.allowedPaymentMethods.includes('stripe') ? 'text-violet-900' : 'text-gray-900'}`}>
                    Stripe
                  </div>
                  <p className={`text-xs ${formData.allowedPaymentMethods.includes('stripe') ? 'text-violet-700' : 'text-gray-500'}`}>
                    Tarjetas de crédito y débito
                  </p>

                </div>
                <div className={`mt-0.5 h-3 w-3 rounded-full ${formData.allowedPaymentMethods.includes('stripe') ? 'bg-violet-500' : 'bg-gray-300'}`} />
              </div>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => toggleAllowedPaymentMethod('cash')}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  void toggleAllowedPaymentMethod('cash');
                }
              }}
              className={`p-4 border-2 rounded-xl transition-all duration-200 cursor-pointer ${
              formData.allowedPaymentMethods.includes('cash')
                ? 'border-green-500 bg-green-50 shadow-md'
                : 'border-gray-200 bg-white'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={`text-sm font-semibold mb-1 ${formData.allowedPaymentMethods.includes('cash') ? 'text-green-900' : 'text-gray-900'}`}>
                    Efectivo
                  </div>
                  <p className={`text-xs ${formData.allowedPaymentMethods.includes('cash') ? 'text-green-700' : 'text-gray-500'}`}>
                    Pago en persona en la academia
                  </p>
                </div>
                <div className={`mt-0.5 h-3 w-3 rounded-full ${formData.allowedPaymentMethods.includes('cash') ? 'bg-green-500' : 'bg-gray-300'}`} />
              </div>
            </div>

            <div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleAllowedPaymentMethod('transferencia')}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    void toggleAllowedPaymentMethod('transferencia');
                  }
                }}
                className={`p-4 border-2 rounded-xl transition-all duration-200 cursor-pointer ${
                formData.allowedPaymentMethods.includes('transferencia')
                  ? 'border-gray-500 bg-gray-50 shadow-md'
                  : 'border-gray-200 bg-white'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold mb-1 text-gray-900">Transferencia</div>
                    <p className="text-xs text-gray-600">Transferencia a la academia</p>
                  </div>
                  <div className={`mt-0.5 h-3 w-3 rounded-full ${formData.allowedPaymentMethods.includes('transferencia') ? 'bg-gray-500' : 'bg-gray-300'}`} />
                </div>
              </div>
              {isTransferenciaExpanded && (
                <div className="mt-2 flex gap-2 items-stretch">
                  <input
                    type="text"
                    value={formData.transferenciaIban}
                    onChange={(e) => setFormData({ ...formData, transferenciaIban: formatSpanishIbanInput(e.target.value) })}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        void saveTransferenciaSetup();
                      }
                      if (event.key === 'Escape') {
                        event.preventDefault();
                        setExpandedPaymentMethod(null);
                        setFormData((current) => ({ ...current, transferenciaIban: academy?.transferenciaIban || 'ES' }));
                      }
                    }}
                    placeholder="ES12 1234 1234 12 1234567890"
                    className="flex-1 min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    maxLength={29}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => void saveTransferenciaSetup()}
                    className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors flex-shrink-0"
                  >
                    OK
                  </button>
                </div>
              )}
            </div>

            <div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleAllowedPaymentMethod('bizum')}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    void toggleAllowedPaymentMethod('bizum');
                  }
                }}
                className={`p-4 border-2 rounded-xl transition-all duration-200 cursor-pointer ${
                formData.allowedPaymentMethods.includes('bizum')
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className={`text-sm font-semibold mb-1 ${formData.allowedPaymentMethods.includes('bizum') ? 'text-blue-900' : 'text-gray-900'}`}>
                      Bizum
                    </div>
                    <p className={`text-xs ${formData.allowedPaymentMethods.includes('bizum') ? 'text-blue-700' : 'text-gray-500'}`}>
                      Bizum a la academia
                    </p>
                  </div>
                  <div className={`mt-0.5 h-3 w-3 rounded-full ${formData.allowedPaymentMethods.includes('bizum') ? 'bg-blue-500' : 'bg-gray-300'}`} />
                </div>
              </div>
              {isBizumExpanded && (
                <div className="mt-2 flex gap-2 items-stretch">
                  <input
                    type="tel"
                    value={formData.bizumPhone}
                    onChange={(e) => setFormData({ ...formData, bizumPhone: formatSpanishBizumPhone(e.target.value) })}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        void saveBizumSetup();
                      }
                      if (event.key === 'Escape') {
                        event.preventDefault();
                        setExpandedPaymentMethod(null);
                        setFormData((current) => ({ ...current, bizumPhone: academy?.bizumPhone || '' }));
                      }
                    }}
                    placeholder="+34 600 123 456"
                    className="flex-1 min-w-0 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    maxLength={15}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => void saveBizumSetup()}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors flex-shrink-0"
                  >
                    OK
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Streaming Accounts */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-12">
        <div className="px-4 sm:px-8 py-4 sm:py-6 bg-gray-900 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold">Cuentas de Streaming</h2>
              <p className="text-gray-300 mt-1">Gestiona tus cuentas de Zoom o GoToMeeting para clases en vivo</p>
            </div>
            <div ref={streamingDropdownRef} className="relative">
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                onClick={() => setStreamingDropdownOpen((o) => !o)}
                onMouseEnter={() => streamingIconRef.current?.startAnimation()}
                onMouseLeave={() => streamingIconRef.current?.stopAnimation()}
              >
                <CctvIcon ref={streamingIconRef} size={16} />
                Conectar cuenta
                <svg className="w-4 h-4 ml-1 transition-transform" style={{ transform: streamingDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {streamingDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-20 overflow-hidden">
                  <button
                    type="button"
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                    onClick={() => { handleConnectZoom(); setStreamingDropdownOpen(false); }}
                  >
                    <Image src="/images/zoom_logo.png" alt="Zoom" width={20} height={20} unoptimized className="w-5 h-5 object-contain" />
                    Zoom
                  </button>
                  <div className="border-t border-gray-100" />
                  <button
                    type="button"
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                    onClick={() => { handleConnectGTM(); setStreamingDropdownOpen(false); }}
                  >
                    <Image src="/images/GTM_logo.png" alt="GoToMeeting" width={20} height={20} unoptimized className="w-5 h-5 object-contain" />
                    GoToMeeting
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-8 py-4 sm:py-6">
          {zoomAccounts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-900 font-medium">No hay cuentas conectadas</p>
              <p className="text-sm text-gray-500 mt-1">Conecta una cuenta de Zoom o GoToMeeting para crear clases en vivo</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {zoomAccounts.map(account => (
                <div key={account.id} className="group relative bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:border-brand-500 hover:shadow-lg transition-all">
                  {/* Delete button - top right corner (shown on hover) */}
                  <button
                    onClick={() => handleDisconnectZoom(account.id)}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-red-600 hover:bg-red-50 rounded-lg z-10"
                    title="Desconectar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 overflow-hidden p-2">
                      <Image
                        src={account.provider === 'gotomeeting' ? '/images/GTM_logo.png' : '/images/zoom_logo.png'}
                        alt={account.provider === 'gotomeeting' ? 'GoToMeeting' : 'Zoom'}
                        width={80}
                        height={48}
                        unoptimized
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 truncate">{account.accountName}</p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Activa
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">ID: {account.accountId}</p>
                      </div>
                      <p className="text-xs text-gray-500 pr-8">
                        Conectado el {new Date(account.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  
                    <div className="pt-3">
                    {account.classes && account.classes.length > 0 && (() => {
                      const visibleClasses = activePeriodId === 'all'
                        ? account.classes
                        : account.classes.filter(cls => cls.startDate ? isClassInPeriod(cls.startDate) : true);
                      if (visibleClasses.length === 0) return null;
                      return (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-700 mb-1">Clases asignadas:</p>
                        <div className="flex flex-wrap gap-1">
                          {visibleClasses.map((cls) => (
                            <span key={cls.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700">
                              {cls.name}
                            </span>
                          ))}
                        </div>
                      </div>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Streaming Assignment Instructions */}
          {zoomAccounts.length > 0 && (
            <div className="border-2 border-gray-900 rounded-lg p-4 mt-6">
              <p className="text-sm text-gray-900">
                Para asignar una cuenta de Streaming a una clase, ve a la{' '}
                <a href="/dashboard/academy/subjects" className="font-bold hover:text-gray-700">
                  página de clases
                </a>
                {' '}y edita la clase correspondiente.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stripe Connect */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-12">
        <div className="px-4 sm:px-8 py-4 sm:py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold">Cuenta de Stripe</h2>
              <p className="text-indigo-100 mt-1">Recibe pagos de estudiantes directamente en tu cuenta bancaria</p>
            </div>
            {!stripeStatus?.connected && (
              <StripeConnectButton onClick={handleConnectStripe} />
            )}
          </div>
        </div>

        <div className="px-4 sm:px-8 py-4 sm:py-6">
          {!stripeStatus?.connected ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <p className="text-gray-900 font-medium mb-2">Cuenta no conectada</p>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Conecta tu cuenta de Stripe para recibir pagos de estudiantes directamente en tu cuenta bancaria. Los estudiantes podrán pagar con tarjeta, transferencia bancaria o Transferencia.
              </p>
            </div>
          ) : stripeStatus.charges_enabled ? (
            <>
              <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:border-brand-500 hover:shadow-lg transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 overflow-hidden">
                    <Image
                      src="/images/Stripe_logo.svg"
                      alt="Stripe"
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">{stripeStatus.email || 'Cuenta de Stripe'}</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Activa
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">ID: {stripeStatus.accountId}</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      Conectado el {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Platform fee notice - outside card */}
              <div className="border-2 border-gray-900 rounded-lg p-4 mt-6">
                <p className="text-sm text-gray-900">
                  <strong>Comisión de plataforma:</strong> Stripe cobra una comisión del 2.9% sobre cada pago.
                </p>
              </div>
            </>
          ) : (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-indigo-900 mb-2">Verificación en proceso</h3>
                  <p className="text-indigo-700 text-sm mb-4">
                    Tu cuenta de Stripe está siendo verificada. Este proceso puede tardar entre 24-48 horas. Recibirás un email de Stripe cuando esté lista.
                  </p>
                  
                  <div className="bg-white/70 rounded-lg p-4 border border-indigo-200 mb-4">
                    <p className="text-sm text-gray-700 mb-1"><span className="font-medium">ID de cuenta:</span> {stripeStatus.accountId}</p>
                    <p className="text-xs text-gray-600 mt-2">
                      ⏳ Estado: Esperando verificación de Stripe
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs text-blue-800">
                      <strong>¿Qué sigue?</strong> Stripe está verificando tu información. Una vez aprobada, podrás recibir pagos automáticamente. No necesitas hacer nada más.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Academic Period Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-12">
        <div className="px-4 sm:px-8 py-4 sm:py-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold">Períodos Académicos</h2>
              <p className="text-blue-100 mt-1">Organiza tu academia por períodos — año académico, semestre, verano, etc.</p>
            </div>
            <button
              onClick={() => setShowAcademicYearModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-lg font-medium text-sm hover:bg-blue-50 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Período
            </button>
          </div>
        </div>
        <div className="px-4 sm:px-8 py-4 sm:py-6">
          {academicYears.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-900 font-medium mb-1">No hay períodos creados</p>
              <p className="text-sm text-gray-500">Crea tu primer período para organizar las asignaturas por etapas de tiempo.</p>
              <button
                onClick={() => setShowAcademicYearModal(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Crear primer período
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* "All periods" view — treated same as any period (green when active, Activar when not) */}
              <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${activePeriodId === 'all' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${activePeriodId === 'all' ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div>
                    <p className="font-semibold text-gray-900">Todos los períodos</p>
                    <p className="text-xs text-gray-500 mt-0.5">Ver datos de todos los períodos sin filtro</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activePeriodId === 'all' ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Período activo</span>
                  ) : (
                    <button
                      onClick={() => setActivePeriodId('all')}
                      className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                    >
                      Activar
                    </button>
                  )}
                </div>
              </div>
              {(() => {
                const sortedYears = [...academicYears].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
                const getWarning = (year: AcademicYear): { type: 'overlap' | 'gap'; message: string } | null => {
                  for (const other of academicYears) {
                    if (other.id === year.id) continue;
                    const aStart = new Date(year.startDate + 'T12:00:00');
                    const aEnd = year.endDate ? new Date(year.endDate + 'T12:00:00') : null;
                    const bStart = new Date(other.startDate + 'T12:00:00');
                    const bEnd = other.endDate ? new Date(other.endDate + 'T12:00:00') : null;
                    const bEffectiveEnd = bEnd ?? new Date('9999-12-31');
                    const aEffectiveEnd = aEnd ?? new Date('9999-12-31');
                    if (bStart <= aEffectiveEnd && aStart <= bEffectiveEnd) {
                      return { type: 'overlap', message: `Se solapa con "${other.name}"` };
                    }
                  }
                  const idx = sortedYears.findIndex(y => y.id === year.id);
                  if (idx > 0) {
                    const prev = sortedYears[idx - 1];
                    if (prev.endDate && new Date(prev.endDate + 'T12:00:00').getTime() + 86400000 < new Date(year.startDate + 'T12:00:00').getTime()) {
                      return { type: 'gap', message: `Hay un hueco entre "${prev.name}" y este período` };
                    }
                  }
                  if (idx >= 0 && idx < sortedYears.length - 1) {
                    const next = sortedYears[idx + 1];
                    if (year.endDate && new Date(year.endDate + 'T12:00:00').getTime() + 86400000 < new Date(next.startDate + 'T12:00:00').getTime()) {
                      return { type: 'gap', message: `Hay un hueco entre este período y "${next.name}"` };
                    }
                  }
                  return null;
                };
                return academicYears.map((year) => {
                  const warning = getWarning(year);
                  return (
                <div key={year.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${activePeriodId === year.id ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${activePeriodId === year.id ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div>
                      <p className="font-semibold text-gray-900 inline-flex items-center gap-1">{year.name}{warning && (
                          <span className="relative group inline-flex items-center ml-1">
                            <svg className="w-3.5 h-3.5 text-amber-500 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span className="absolute bottom-full left-0 mb-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-52">
                              {warning.message}
                            </span>
                          </span>
                        )}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(year.startDate + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {year.endDate && ` → ${new Date(year.endDate + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Edit button */}
                    <button
                      onClick={() => {
                        setEditingYear(year);
                        setEditYearData({ name: year.name, startDate: year.startDate, endDate: year.endDate || '' });
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Editar período"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    {activePeriodId === year.id ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Período activo</span>
                    ) : (
                      <button
                        onClick={() => handleSetCurrentPeriod(year.id)}
                        className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                      >
                        Activar
                      </button>
                    )}
                  </div>
                </div>
              );
                  });
              })()}
              <p className="text-xs text-gray-400 pt-1">Las asignaturas cuya fecha de inicio se encuentre dentro del período activo se mostrarán en el panel principal.</p>
            </div>
          )}
        </div>
      </div>

      {/* Academic Period Modal */}
      {showAcademicYearModal && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowAcademicYearModal(false); }}>
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Nuevo Período</h3>
                <button onClick={() => setShowAcademicYearModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre del período <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Ej: 2025-2026, Verano 2025, Semestre 1..."
                    value={newYearData.name}
                    onChange={(e) => setNewYearData(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha de inicio <span className="text-red-500">*</span></label>
                  <CustomDatePicker
                    value={newYearData.startDate}
                    onChange={(v) => setNewYearData(p => ({ ...p, startDate: v }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha de fin <span className="text-gray-400 text-xs">(opcional)</span></label>
                  <CustomDatePicker
                    value={newYearData.endDate}
                    onChange={(v) => setNewYearData(p => ({ ...p, endDate: v }))}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAcademicYearModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateAcademicYear}
                  disabled={!newYearData.name || !newYearData.startDate || creatingYear}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {creatingYear ? 'Creando...' : 'Crear período'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Edit Academic Period Modal */}
      {editingYear && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setEditingYear(null); }}>
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Editar Período</h3>
                <button onClick={() => setEditingYear(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre del período <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Ej: 2025-2026, Verano 2025, Semestre 1..."
                    value={editYearData.name}
                    onChange={(e) => setEditYearData(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha de inicio <span className="text-red-500">*</span></label>
                  <CustomDatePicker
                    value={editYearData.startDate}
                    onChange={(v) => setEditYearData(p => ({ ...p, startDate: v }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha de fin <span className="text-gray-400 text-xs">(opcional)</span></label>
                  <CustomDatePicker
                    value={editYearData.endDate}
                    onChange={(v) => setEditYearData(p => ({ ...p, endDate: v }))}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditingYear(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEditAcademicYear}
                  disabled={!editYearData.name || !editYearData.startDate || savingEditYear}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {savingEditYear ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Password Change Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-8 py-4 sm:py-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Seguridad</h2>
              <p className="text-sm text-gray-600 mt-1">Cambia tu contraseña</p>
            </div>
            {!showPasswordForm ? (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Cambiar Contraseña
              </button>
            ) : (
              <button
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>

        {showPasswordForm && (
          <div className="px-4 sm:px-8 py-4 sm:py-6">
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña Actual</label>
                  <PasswordInput
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nueva Contraseña</label>
                  <PasswordInput
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Nueva Contraseña</label>
                <PasswordInput
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-all font-medium text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Actualizar Contraseña
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
