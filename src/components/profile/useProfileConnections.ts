import { apiClient } from '@/lib/api-client';
import type { ProfileState } from './useProfileData';

export function useProfileConnections(s: ProfileState) {
  const { academy, zoomAccounts, setZoomAccounts, setStripeStatus, setFormData, setConnectingStripe, setAcademicYears, setShowAcademicYearModal, setNewYearData, setCreatingYear, editingYear, editYearData, setSavingEditYear, setEditingYear, setActivePeriodId, newYearData } = s;

  const handleConnectZoom = () => {
    const clientId = 'W2jPo9CJR0uZbFnEWtBF7Q';
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/zoom/oauth/callback`);
    const state = academy?.id || '';
    window.location.href = `https://zoom.us/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;
  };

  const handleConnectGTM = async () => {
    try {
      const response = await apiClient('/zoom-accounts/gtm-connect-url', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academyId: academy?.id || '' }),
      });
      const result = await response.json();
      if (result.success && result.data?.url) window.location.href = result.data.url;
    } catch (error) {
      console.error('Error connecting GoToMeeting:', error);
      alert('Error al conectar GoToMeeting');
    }
  };

  const handleDisconnectZoom = async (accountId: string) => {
    if (!confirm('¿Estás seguro de que deseas desconectar esta cuenta de Zoom?')) return;
    try {
      const response = await apiClient(`/zoom-accounts/${accountId}`, { method: 'DELETE' });
      if (response.ok) setZoomAccounts(zoomAccounts.filter(acc => acc.id !== accountId));
    } catch (error) {
      console.error('Error disconnecting Zoom:', error);
      alert('Error al desconectar la cuenta de Zoom');
    }
  };

  const handleConnectStripe = async () => {
    setConnectingStripe(true);
    try {
      const response = await apiClient('/payments/stripe-connect', { method: 'POST' });
      const result = await response.json();
      if (result.success && result.data?.url) window.location.href = result.data.url;
      else { setConnectingStripe(false); alert('Error al conectar con Stripe: ' + (result.error || 'Error desconocido')); }
    } catch (error) {
      console.error('Error connecting Stripe:', error);
      setConnectingStripe(false);
      alert('Error al conectar con Stripe');
    }
  };

  const handleDisconnectStripe = async () => {
    if (!confirm('¿Estás seguro de que deseas desconectar tu cuenta de Stripe? Los pagos con tarjeta dejarán de estar disponibles.')) return;
    try {
      const res = await apiClient('/payments/stripe-connect', { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        setStripeStatus(null);
        setFormData((f) => ({ ...f, allowedPaymentMethods: f.allowedPaymentMethods.filter((m) => m !== 'stripe') }));
      } else alert('Error al desconectar Stripe: ' + (result.error || 'Error desconocido'));
    } catch { alert('Error al desconectar Stripe'); }
  };

  const handleCreateAcademicYear = async () => {
    if (!newYearData.name.trim() || !newYearData.startDate) return;
    setCreatingYear(true);
    try {
      const res = await apiClient('/academic-years', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newYearData.name.trim(), startDate: newYearData.startDate, endDate: newYearData.endDate || null }),
      });
      const result = await res.json();
      if (result.success) {
        setAcademicYears(result.data || []);
        setShowAcademicYearModal(false);
        setNewYearData({ name: '', startDate: '', endDate: '' });
      } else alert('Error al crear el período: ' + (result.error || 'Error desconocido'));
    } catch (e) {
      console.error('Error creating academic period:', e);
      alert('Error de conexión al crear el período');
    } finally { setCreatingYear(false); }
  };

  const handleSetCurrentPeriod = async (periodId: string) => {
    setActivePeriodId(periodId); // optimistic — mirrors sidebar behaviour
    try {
      const res = await apiClient(`/academic-years/${periodId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isCurrent: 1 }),
      });
      const result = await res.json();
      if (result.success) { setAcademicYears(result.data || []); }
      else console.error('Failed to persist active period to DB:', result.error);
    } catch (e) { console.error('Error switching period:', e); }
  };

  const handleEditAcademicYear = async () => {
    if (!editingYear || !editYearData.name.trim() || !editYearData.startDate) return;
    setSavingEditYear(true);
    try {
      const res = await apiClient(`/academic-years/${editingYear.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editYearData.name.trim(), startDate: editYearData.startDate, endDate: editYearData.endDate || null }),
      });
      const result = await res.json();
      if (result.success) { setAcademicYears(result.data || []); setEditingYear(null); }
      else alert('Error al editar el período: ' + (result.error || 'Error desconocido'));
    } catch (e) {
      console.error('Error editing academic period:', e);
      alert('Error de conexión al editar el período');
    } finally { setSavingEditYear(false); }
  };

  return {
    handleConnectZoom, handleConnectGTM, handleDisconnectZoom,
    handleConnectStripe, handleDisconnectStripe,
    handleCreateAcademicYear, handleSetCurrentPeriod, handleEditAcademicYear,
  };
}

export type ProfileConnections = ReturnType<typeof useProfileConnections>;
