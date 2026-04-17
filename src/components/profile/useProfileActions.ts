import { apiClient } from '@/lib/api-client';
import { refreshAcademyLogo } from '@/hooks/useAcademyLogo';
import { formatSpanishIbanInput, isValidSpanishIban, formatSpanishBizumPhone, isValidSpanishBizumPhone } from './profile-types';
import type { ProfileState } from './useProfileData';

type SettingField = keyof ProfileState['formData'];
type SettingValue = string | number | boolean | string[];

export function useProfileActions(s: ProfileState) {
  const { academy, formData, setFormData, stripeStatus, expandedPaymentMethod, setExpandedPaymentMethod, setSaving, setEditing, setUploadingLogo, loadData, setPasswordData, setShowPasswordForm, setEmailChangeStep, setPendingEmailChange, emailChangeCode, setEmailChangeCode, refetchUser } = s;

  const handleSettingChange = async (field: SettingField, value: SettingValue) => {
    if (!academy) return;
    const stateValue = field === 'allowedPaymentMethods' ? (JSON.parse(String(value)) as string[]) : value;
    const newFormData = { ...formData, [field]: stateValue };
    setFormData(newFormData);
    try {
      const body = {
        name: newFormData.name, address: newFormData.address, phone: newFormData.phone,
        feedbackEnabled: field === 'feedbackEnabled' ? value : (newFormData.feedbackEnabled ? 1 : 0),
        defaultWatermarkIntervalMins: newFormData.defaultWatermarkIntervalMins,
        defaultMaxWatchTimeMultiplier: newFormData.defaultMaxWatchTimeMultiplier,
        allowedPaymentMethods: field === 'allowedPaymentMethods' ? value : JSON.stringify(newFormData.allowedPaymentMethods),
        transferenciaIban: field === 'transferenciaIban' ? value : newFormData.transferenciaIban,
        bizumPhone: field === 'bizumPhone' ? value : newFormData.bizumPhone,
        requireGrading: field === 'requireGrading' ? value : (newFormData.requireGrading ? 1 : 0),
        hiddenMenuItems: field === 'hiddenMenuItems' ? JSON.stringify(value) : JSON.stringify(newFormData.hiddenMenuItems),
      };
      const response = await apiClient(`/academies/${academy.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const result = await response.json();
      if (result.success) {
        if (field === 'feedbackEnabled') window.dispatchEvent(new CustomEvent('feedbackToggled', { detail: { feedbackEnabled: value } }));
        if (field === 'requireGrading') window.dispatchEvent(new CustomEvent('feedbackToggled', { detail: { requireGrading: value } }));
        if (field === 'hiddenMenuItems') window.dispatchEvent(new CustomEvent('feedbackToggled'));
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
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name, address: formData.address, phone: formData.phone,
          feedbackEnabled: formData.feedbackEnabled ? 1 : 0,
          defaultWatermarkIntervalMins: formData.defaultWatermarkIntervalMins,
          defaultMaxWatchTimeMultiplier: formData.defaultMaxWatchTimeMultiplier,
          allowedPaymentMethods: JSON.stringify(formData.allowedPaymentMethods),
          transferenciaIban: formData.transferenciaIban, bizumPhone: formData.bizumPhone,
          requireGrading: formData.requireGrading ? 1 : 0, hiddenMenuItems: JSON.stringify(formData.hiddenMenuItems),
        }),
      });
      const result = await response.json();
      if (result.success) { setEditing(false); await loadData(); refreshAcademyLogo(); }
      else alert('Error al guardar los cambios');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error al guardar los cambios');
    } finally { setSaving(false); }
  };

  const handleRequestEmailChange = async (newEmail: string) => {
    setEmailChangeStep('sending');
    try {
      const res = await apiClient('/auth/request-email-change', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail }),
      });
      const result = await res.json();
      if (result.success) {
        setPendingEmailChange(newEmail);
        setEmailChangeStep('confirming');
      } else {
        alert(result.error || 'Error al enviar el código de verificación');
        setEmailChangeStep('idle');
      }
    } catch {
      alert('Error al enviar el código de verificación');
      setEmailChangeStep('idle');
    }
  };

  const handleConfirmEmailChange = async () => {
    const { pendingEmailChange: newEmail } = s;
    if (!newEmail || !emailChangeCode) return;
    try {
      const res = await apiClient('/auth/confirm-email-change', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail, code: emailChangeCode }),
      });
      const result = await res.json();
      if (result.success) {
        setEmailChangeStep('idle');
        setPendingEmailChange(null);
        setEmailChangeCode('');
        await refetchUser();
        await loadData();
      } else {
        alert(result.error || 'Código incorrecto');
      }
    } catch {
      alert('Error al confirmar el cambio de email');
    }
  };

  const handleCancelEmailChange = () => {
    setEmailChangeStep('idle');
    setPendingEmailChange(null);
    setEmailChangeCode('');
    // Reset form email to current server email (from academy response which joins User)
    if (academy?.email) setFormData((prev) => ({ ...prev, email: academy.email as string }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!academy || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    const validTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) { alert('Solo se permiten archivos SVG, PNG o JPG'); return; }
    if (file.size > 500 * 1024) { alert('El logo debe ser menor a 500KB'); return; }
    setUploadingLogo(true);
    try {
      const ownerEmail = academy.email || s.user?.email || '';
      const username = ownerEmail.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '_') || academy.id;
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const safeFileName = `${username}.${ext}`;
      const uploadForm = new FormData();
      uploadForm.append('file', file);
      uploadForm.append('path', `academy-logos/${academy.id}/${safeFileName}`);
      const uploadRes = await apiClient('/storage/upload', { method: 'POST', body: uploadForm });
      const uploadResult = await uploadRes.json();
      if (!uploadResult.success) throw new Error(uploadResult.error || 'Upload failed');
      const logoPath = uploadResult.data.path;
      const updateRes = await apiClient(`/academies/${academy.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ logoUrl: logoPath }),
      });
      const updateResult = await updateRes.json();
      if (updateResult.success) { await loadData(); refreshAcademyLogo(); }
      else throw new Error('Failed to update academy');
    } catch (error: unknown) {
      console.error('Error uploading logo:', error);
      alert('Error al subir el logo');
    } finally { setUploadingLogo(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (s.passwordData.newPassword !== s.passwordData.confirmPassword) { alert('Las contraseñas no coinciden'); return; }
    alert('Funcionalidad en desarrollo');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswordForm(false);
  };

  const toggleAllowedPaymentMethod = async (method: 'stripe' | 'cash' | 'transferencia' | 'bizum') => {
    if (method === 'transferencia' || method === 'bizum') {
      const isActive = formData.allowedPaymentMethods.includes(method);
      if (isActive) {
        if (formData.allowedPaymentMethods.length === 1) { alert('Debes tener al menos un método de pago habilitado'); return; }
        setExpandedPaymentMethod(null);
        const updated = formData.allowedPaymentMethods.filter((m) => m !== method);
        await handleSettingChange('allowedPaymentMethods', JSON.stringify(updated));
        return;
      }
      if (expandedPaymentMethod === method) {
        setExpandedPaymentMethod(null);
        setFormData((current) => ({ ...current, transferenciaIban: academy?.transferenciaIban || 'ES', bizumPhone: academy?.bizumPhone || '' }));
        return;
      }
      setExpandedPaymentMethod(method);
      return;
    }
    const currentMethods = Array.isArray(formData.allowedPaymentMethods) ? formData.allowedPaymentMethods : [];
    const hasMethod = currentMethods.includes(method);
    if (!hasMethod && method === 'stripe' && !stripeStatus?.charges_enabled) { alert('Debes conectar una cuenta de Stripe antes de habilitar pagos con Stripe'); return; }
    if (hasMethod && currentMethods.length === 1) { alert('Debes tener al menos un método de pago habilitado'); return; }
    const updated = hasMethod ? currentMethods.filter((m) => m !== method) : [...currentMethods, method];
    await handleSettingChange('allowedPaymentMethods', JSON.stringify(updated));
  };

  const saveTransferenciaSetup = async () => {
    const normalizedIban = formatSpanishIbanInput(formData.transferenciaIban);
    if (!isValidSpanishIban(normalizedIban)) { alert('Introduce un IBAN español válido antes de guardar Transferencia'); return; }
    setFormData((current) => ({ ...current, transferenciaIban: normalizedIban }));
    setExpandedPaymentMethod(null);
    await handleSettingChange('transferenciaIban', normalizedIban);
    if (!formData.allowedPaymentMethods.includes('transferencia')) {
      await handleSettingChange('allowedPaymentMethods', JSON.stringify([...formData.allowedPaymentMethods, 'transferencia']));
    }
  };

  const saveBizumSetup = async () => {
    const normalizedPhone = formatSpanishBizumPhone(formData.bizumPhone);
    if (!isValidSpanishBizumPhone(normalizedPhone)) { alert('Introduce un teléfono español válido antes de guardar Bizum'); return; }
    setFormData((current) => ({ ...current, bizumPhone: normalizedPhone }));
    setExpandedPaymentMethod(null);
    await handleSettingChange('bizumPhone', normalizedPhone);
    if (!formData.allowedPaymentMethods.includes('bizum')) {
      await handleSettingChange('allowedPaymentMethods', JSON.stringify([...formData.allowedPaymentMethods, 'bizum']));
    }
  };

  return { handleSettingChange, handleSaveProfile, handleLogoUpload, handleChangePassword, toggleAllowedPaymentMethod, saveTransferenciaSetup, saveBizumSetup, handleRequestEmailChange, handleConfirmEmailChange, handleCancelEmailChange };
}

export type ProfileActions = ReturnType<typeof useProfileActions>;
