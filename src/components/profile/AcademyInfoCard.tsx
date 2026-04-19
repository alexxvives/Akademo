'use client';

import { useState } from 'react';
import Image from 'next/image';
import { refreshAcademyLogo } from '@/hooks/useAcademyLogo';
import type { ProfileState } from './useProfileData';
import type { ProfileActions } from './useProfileActions';

export function AcademyInfoCard({ s, actions }: { s: ProfileState; actions: ProfileActions }) {
  const { academy, setAcademy, formData, setFormData, uploadingLogo, user, emailChangeStep, pendingEmailChange, emailChangeCode, setEmailChangeCode, originalEmail } = s;
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  if (!academy) return null;

  const handleBlur = async () => {
    const ok = await actions.handleBlurSave();
    setSaveStatus(ok ? 'saved' : 'error');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-8 py-4 sm:py-6 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Información General</h2>
            <p className="text-sm text-gray-600 mt-1">Datos principales de tu academia</p>
          </div>
          {saveStatus === 'saved' && (
            <span className="inline-flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Guardado
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-sm text-red-500 font-medium">Error al guardar</span>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la academia</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} onBlur={handleBlur} className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all" placeholder="Ej: Academia de Matemáticas Avanzadas" />
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
            ) : (
              <div className="flex gap-2">
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm" placeholder="contacto@academia.com" />
                {formData.email && formData.email !== originalEmail && (
                  <button
                    onClick={() => actions.handleRequestEmailChange(formData.email)}
                    disabled={emailChangeStep === 'sending'}
                    className="flex-shrink-0 px-3 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-40 whitespace-nowrap"
                  >
                    {emailChangeStep === 'sending' ? 'Enviando…' : 'Verificar'}
                  </button>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
            <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} onBlur={handleBlur} className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm" placeholder="+34 123 456 789" />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
            <div className="relative">
              <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} onBlur={handleBlur} className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm" placeholder="Calle Principal 123" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
