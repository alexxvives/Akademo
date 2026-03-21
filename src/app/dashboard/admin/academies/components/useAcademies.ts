'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { Academy, BillingRecord } from '../types';

export function useAcademies() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [togglingDailyId, setTogglingDailyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [billingByAcademy, setBillingByAcademy] = useState<Record<string, BillingRecord[]>>({});
  const [migrationAcademy, setMigrationAcademy] = useState<{ id: string; name: string } | null>(null);

  const loadAcademies = async () => {
    try {
      const res = await apiClient('/admin/academies');
      const result = await res.json();
      if (result.success) setAcademies(result.data || []);
    } catch { /* skip */ } finally { setLoading(false); }
  };

  useEffect(() => { loadAcademies(); }, []);

  const loadBilling = useCallback(async (academyId: string) => {
    if (billingByAcademy[academyId]) return;
    try {
      const res = await apiClient(`/admin/academy/${academyId}/billing`);
      const result = await res.json();
      if (result.success) setBillingByAcademy(prev => ({ ...prev, [academyId]: result.data as BillingRecord[] }));
    } catch { /* skip */ }
  }, [billingByAcademy]);

  const handleToggleExpand = (academyId: string) => {
    if (expandedId === academyId) { setExpandedId(null); return; }
    setExpandedId(academyId);
    loadBilling(academyId);
  };

  const handleTogglePayment = async (academy: Academy) => {
    if (togglingId === academy.id) return;
    setTogglingId(academy.id);
    const newStatus = academy.paymentStatus === 'PAID' ? 'NOT PAID' : 'PAID';
    try {
      const res = await apiClient(`/admin/academy/${academy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });
      const result = await res.json();
      if (result.success) {
        setAcademies(prev => prev.map(a => a.id === academy.id ? { ...a, paymentStatus: newStatus } : a));
      }
    } catch { /* skip */ } finally { setTogglingId(null); }
  };

  const handleToggleDaily = async (academy: Academy) => {
    if (togglingDailyId === academy.id) return;
    setTogglingDailyId(academy.id);
    const newValue = academy.dailyEnabled ? 0 : 1;
    try {
      const res = await apiClient(`/admin/academy/${academy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyEnabled: newValue }),
      });
      const result = await res.json();
      if (result.success) {
        setAcademies(prev => prev.map(a => a.id === academy.id ? { ...a, dailyEnabled: newValue } : a));
      }
    } catch { /* skip */ } finally { setTogglingDailyId(null); }
  };

  const handleDelete = async (ownerId: string, academyName: string) => {
    if (!confirm(`¿Eliminar la academia "${academyName}" y todos sus datos? Esta acción no se puede deshacer.`)) return;
    setDeletingId(ownerId);
    try {
      const res = await apiClient(`/admin/users/${ownerId}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) await loadAcademies();
      else alert('Error: ' + result.error);
    } catch { alert('Error al eliminar la academia'); } finally { setDeletingId(null); }
  };

  const handleBillingAdded = (academyId: string, record: BillingRecord) => {
    setBillingByAcademy(prev => {
      const existing = (prev[academyId] ?? []).filter(r => r.id !== record.id);
      return { ...prev, [academyId]: [record, ...existing].sort((a, b) => b.year - a.year || b.month - a.month) };
    });
  };

  const handleBillingDeleted = async (academyId: string, billingId: string) => {
    try {
      await apiClient(`/admin/academy/${academyId}/billing/${billingId}`, { method: 'DELETE' });
      setBillingByAcademy(prev => ({ ...prev, [academyId]: (prev[academyId] ?? []).filter(r => r.id !== billingId) }));
    } catch { /* skip */ }
  };

  return {
    academies, loading, deletingId, togglingId, togglingDailyId,
    expandedId, billingByAcademy, migrationAcademy,
    setMigrationAcademy, handleToggleExpand, handleTogglePayment,
    handleToggleDaily, handleDelete, handleBillingAdded, handleBillingDeleted,
  };
}
