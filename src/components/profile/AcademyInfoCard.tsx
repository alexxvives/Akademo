'use client';

import Image from 'next/image';
import { refreshAcademyLogo } from '@/hooks/useAcademyLogo';
import { normalizeAllowedPaymentMethods } from './profile-types';
import type { ProfileState } from './useProfileData';
import type { ProfileActions } from './useProfileActions';

export function AcademyInfoCard({ s, actions }: { s: ProfileState; actions: ProfileActions }) {
  const { academy, setAcademy, formData, setFormData, editing, setEditing, saving, uploadingLogo, user, emailChangeStep, pendingEmailChange, emailChangeCode, setEmailChangeCode } = s;
  if (!academy) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-8 py-4 sm:py-6 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Información General</h2>
            <p className="text-sm text-gray-600 mt-1">Datos principales de tu academia</p>
          </div>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Editar
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    name: academy.name || '', address: academy.address || '', phone: academy.phone || '',
                    email: (academy.email as string | undefined) || user?.email || '',
                    feedbackEnabled: academy.feedbackEnabled !== 0,
                    defaultWatermarkIntervalMins: academy.defaultWatermarkIntervalMins ?? 5,
                    defaultMaxWatchTimeMultiplier: academy.defaultMaxWatchTimeMultiplier ?? 2.0,
                    allowedPaymentMethods: normalizeAllowedPaymentMethods(academy.allowedPaymentMethods),
                    transferenciaIban: academy.transferenciaIban || 'ES', bizumPhone: academy.bizumPhone || '',
                    requireGrading: academy.requireGrading !== 0,
                    hiddenMenuItems: (() => { try { return JSON.parse(academy.hiddenMenuItems || '[]'); } catch { return []; } })(),
                  });
                }}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm"
              >Cancelar</button>
              <button onClick={actions.handleSaveProfile} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-all font-medium text-sm disabled:opacity-50">
                {saving ? (<><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>Guardando...</>) : (<><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Guardar cambios</>)}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la academia</label>
            {editing ? (
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all" placeholder="Ej: Academia de Matemáticas Avanzadas" />
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                <span className="text-gray-900 font-medium">{academy.name}</span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Logo de la academia</label>
            <div className="flex items-center justify-center gap-3">
              {academy.logoUrl ? (
                <div className="relative w-16 h-16 group flex-shrink-0">
                  <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                    <Image src={`/api/storage/serve/${academy.logoUrl}`} alt="Logo" width={64} height={64} className="w-full h-full object-contain" unoptimized />
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm('¿Estás seguro de que quieres eliminar el logo?')) {
                        try {
                          const token = localStorage.getItem('auth_token') || '';
                          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/academies/${academy.id}`, {
                            method: 'PATCH', credentials: 'include',
                            headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                            body: JSON.stringify({ logoUrl: null }),
                          });
                          if (response.ok) { setAcademy({ ...academy, logoUrl: undefined }); refreshAcademyLogo(); }
                          else { const errorData = await response.json(); alert(`Error: ${errorData.error || 'Error al eliminar el logo'}`); }
                        } catch { alert('Error al eliminar el logo'); }
                      }
                    }}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    title="Eliminar logo"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 bg-gray-100 border border-gray-300 border-dashed rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
              )}
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm">
                <input type="file" accept="image/svg+xml,image/png,image/jpeg,image/jpg" onChange={actions.handleLogoUpload} disabled={uploadingLogo} className="hidden" />
                {uploadingLogo ? (<><div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent"></div>Subiendo...</>) : (<><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>{academy.logoUrl ? 'Cambiar' : 'Subir logo'}</>)}
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            {emailChangeStep === 'confirming' ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Código enviado a <strong>{pendingEmailChange}</strong></p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={emailChangeCode}
                    onChange={(e) => setEmailChangeCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button onClick={actions.handleConfirmEmailChange} disabled={emailChangeCode.length !== 6} className="px-3 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-40">Confirmar</button>
                  <button onClick={actions.handleCancelEmailChange} className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
                </div>
              </div>
            ) : editing ? (
              <div className="flex gap-2">
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm" placeholder="contacto@academia.com" />
                {formData.email && formData.email !== (academy.email as string | undefined) && (
                  <button
                    onClick={() => actions.handleRequestEmailChange(formData.email)}
                    disabled={emailChangeStep === 'sending'}
                    className="flex-shrink-0 px-3 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-40 whitespace-nowrap"
                  >
                    {emailChangeStep === 'sending' ? 'Enviando…' : 'Verificar'}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <span className="text-gray-900 text-sm truncate">{user?.email || 'No especificado'}</span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
            {editing ? (
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm" placeholder="+34 123 456 789" />
            ) : (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                <span className="text-gray-900 text-sm">{academy.phone || 'No especificado'}</span>
              </div>
            )}
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Dirección <span className="text-xs text-gray-500">(efectivo)</span></label>
            {editing ? (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm" placeholder="Calle Principal 123" />
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="text-gray-900 text-sm truncate">{academy.address || 'No especificada'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
