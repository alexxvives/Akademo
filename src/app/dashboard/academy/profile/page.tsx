'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import { CctvIcon, CctvIconHandle } from '@/components/icons/CctvIcon';

interface ZoomAccount {
  id: string;
  accountName: string;
  accountId: string;
  createdAt: string;
  classes?: Array<{
    id: string;
    name: string;
  }>;
}

interface Academy {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  address?: string;
  phone?: string;
  email?: string;
  feedbackAnonymous?: number;
  defaultWatermarkIntervalMins?: number;
  defaultMaxWatchTimeMultiplier?: number;
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

export default function ProfilePage() {
  const { user } = useAuth();
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [zoomAccounts, setZoomAccounts] = useState<ZoomAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    feedbackAnonymous: false,
    defaultWatermarkIntervalMins: 5,
    defaultMaxWatchTimeMultiplier: 2.0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [academyRes, zoomRes] = await Promise.all([
        apiClient('/academies'),
        apiClient('/zoom-accounts')
      ]);

      const academyResult = await academyRes.json();
      const zoomResult = await zoomRes.json();

      if (academyResult.success && academyResult.data.length > 0) {
        const academyData = academyResult.data[0];
        setAcademy(academyData);
        setFormData({
          name: academyData.name || '',
          address: academyData.address || '',
          phone: academyData.phone || '',
          email: academyData.email || user?.email || '',
          feedbackAnonymous: academyData.feedbackAnonymous === 1,
          defaultWatermarkIntervalMins: academyData.defaultWatermarkIntervalMins || 5,
          defaultMaxWatchTimeMultiplier: academyData.defaultMaxWatchTimeMultiplier || 2.0
        });
      }

      if (zoomResult.success) {
        setZoomAccounts(zoomResult.data || []);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectZoom = () => {
    // Redirect to Zoom OAuth
    // Note: This is a public OAuth client ID, safe to hardcode
    const clientId = 'W2jPo9CJR0uZbFnEWtBF7Q';
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/zoom/oauth/callback`);
    const state = academy?.id || '';
    window.location.href = `https://zoom.us/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;
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

  const handleSettingChange = async (field: string, value: any) => {
    if (!academy) return;

    // Update local state immediately
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Save to database immediately with ALL current values
    try {
      const response = await apiClient(`/academies/${academy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFormData.name,
          address: newFormData.address,
          phone: newFormData.phone,
          email: newFormData.email,
          feedbackAnonymous: field === 'feedbackAnonymous' ? value : (newFormData.feedbackAnonymous ? 1 : 0),
          defaultWatermarkIntervalMins: newFormData.defaultWatermarkIntervalMins,
          defaultMaxWatchTimeMultiplier: newFormData.defaultMaxWatchTimeMultiplier
        })
      });
      
      const result = await response.json();
      if (!result.success) {
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
          feedbackAnonymous: formData.feedbackAnonymous ? 1 : 0,
          defaultWatermarkIntervalMins: formData.defaultWatermarkIntervalMins,
          defaultMaxWatchTimeMultiplier: formData.defaultMaxWatchTimeMultiplier
        })
      });

      const result = await response.json();
      if (result.success) {
        setEditing(false);
        await loadData();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Información General</h2>
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
                        feedbackAnonymous: academy.feedbackAnonymous === 1,
                        defaultWatermarkIntervalMins: academy.defaultWatermarkIntervalMins || 5,
                        defaultMaxWatchTimeMultiplier: academy.defaultMaxWatchTimeMultiplier || 2.0
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
          <div className="px-8 py-6">
            {/* Nombre de la academia */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la academia <span className="text-red-500">*</span>
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
        <div className="px-8 py-5 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {/* Removed icon next to Configuración Avanzada */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Configuración Avanzada</h3>
              <p className="text-sm text-gray-600">Feedback y reproducción de videos</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Feedback Toggle */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Anonimizar feedback
              </label>
              <p className="text-xs text-gray-500 mb-3">Los estudiantes comentan de forma anónima</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSettingChange('feedbackAnonymous', formData.feedbackAnonymous ? 0 : 1)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${
                    formData.feedbackAnonymous ? 'bg-brand-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                      formData.feedbackAnonymous ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-700 font-medium">
                  {formData.feedbackAnonymous ? 'Activado' : 'Desactivado'}
                </span>
              </div>
            </div>

            {/* Watch Time Multiplier */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Límite de visualización
              </label>
              <p className="text-xs text-gray-500 mb-3">Veces que puede ver el contenido</p>
              <select
                value={formData.defaultMaxWatchTimeMultiplier}
                onChange={(e) => handleSettingChange('defaultMaxWatchTimeMultiplier', parseFloat(e.target.value))}
                className="block w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm bg-white appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNSA3LjVMMTAgMTIuNUwxNSA3LjUiIHN0cm9rZT0iIzZCNzI4MCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==')] bg-no-repeat bg-[position:right_0.75rem_center]"
              >
                {MULTIPLIER_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Watermark Interval */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Marca de agua
              </label>
              <p className="text-xs text-gray-500 mb-3">Frecuencia de aparición</p>
              <select
                value={formData.defaultWatermarkIntervalMins}
                onChange={(e) => handleSettingChange('defaultWatermarkIntervalMins', parseInt(e.target.value))}
                className="block w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm bg-white appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNSA3LjVMMTAgMTIuNUwxNSA3LjUiIHN0cm9rZT0iIzZCNzI4MCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==')] bg-no-repeat bg-[position:right_0.75rem_center]"
              >
                {WATERMARK_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Zoom Accounts */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="px-8 py-6 bg-gray-900 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Cuentas de Zoom</h2>
              <p className="text-gray-300 mt-1">Gestiona tus cuentas de Zoom para clases en vivo</p>
            </div>
            <ZoomConnectButton onClick={handleConnectZoom} />
          </div>
        </div>

        <div className="px-8 py-6">
          {zoomAccounts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-900 font-medium">No hay cuentas conectadas</p>
              <p className="text-sm text-gray-500 mt-1">Conecta una cuenta PRO de Zoom para crear clases en vivo</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {zoomAccounts.map(account => (
                <div key={account.id} className="group relative bg-white border border-gray-200 rounded-xl p-6 hover:border-brand-500 hover:shadow-lg transition-all">
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
                  
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 576 512">
                        <path d="M0 128C0 92.7 28.7 64 64 64H320c35.3 0 64 28.7 64 64V384c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128zM559.1 99.8c10.4 5.6 16.9 16.4 16.9 28.2V384c0 11.8-6.5 22.6-16.9 28.2s-23 5-32.9-1.6l-96-64L416 337.1V320 192 174.9l14.2-9.5 96-64c9.8-6.5 22.4-7.2 32.9-1.6z"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0 flex items-center justify-between">
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
                  
                  <div className="pt-3 border-t border-gray-100">
                    {account.classes && account.classes.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-700 mb-1">Clases asignadas:</p>
                        <div className="flex flex-wrap gap-1">
                          {account.classes.map((cls: any) => (
                            <span key={cls.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700">
                              {cls.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Zoom Assignment Instructions */}
          {zoomAccounts.length > 0 && (
            <div className="border-2 border-gray-900 rounded-lg p-4 mt-6">
              <p className="text-sm text-gray-900">
                Para asignar una cuenta de Zoom a una clase, ve a la{' '}
                <a href="/dashboard/academy/classes" className="font-semibold underline hover:text-gray-700">
                  página de clases
                </a>
                {' '}y edita la clase correspondiente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Animated Zoom Connect Button Component
function ZoomConnectButton({ onClick }: { onClick: () => void }) {
  const iconRef = useRef<CctvIconHandle>(null);
  return (
    <button
      type="button"
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      onClick={onClick}
      onMouseEnter={() => iconRef.current?.startAnimation()}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
    >
      <CctvIcon ref={iconRef} size={20} />
      Conectar Zoom
    </button>
  );
}
