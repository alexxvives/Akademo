'use client';

import type { Dispatch, SetStateAction } from 'react';
import type { StudentUser, ProfileFormData } from './student-profile.types';

interface ProfileInfoCardProps {
  user: StudentUser | null;
  isEditing: boolean;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  formData: ProfileFormData;
  setFormData: Dispatch<SetStateAction<ProfileFormData>>;
  handleSaveProfile: (e: React.FormEvent) => Promise<void>;
  emailChangeStep: 'idle' | 'sending' | 'confirming';
  pendingEmailChange: string | null;
  emailChangeCode: string;
  setEmailChangeCode: Dispatch<SetStateAction<string>>;
  originalEmail: string;
  handleRequestEmailChange: (newEmail: string) => Promise<void>;
  handleConfirmEmailChange: () => Promise<void>;
  handleCancelEmailChange: () => void;
}

export function ProfileInfoCard({ user, isEditing, setIsEditing, formData, setFormData, handleSaveProfile, emailChangeStep, pendingEmailChange, emailChangeCode, setEmailChangeCode, originalEmail, handleRequestEmailChange, handleConfirmEmailChange, handleCancelEmailChange }: ProfileInfoCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-8 py-4 sm:py-6 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Información General</h2>
            <p className="text-sm text-gray-600 mt-1">Tus datos personales</p>
          </div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
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
                  setIsEditing(false);
                  setFormData({
                    firstName: user?.firstName || '',
                    lastName: user?.lastName || '',
                    email: user?.email || '',
                  });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={(e) => {
                  if (formData.email !== originalEmail) {
                    alert('Debes verificar el nuevo email antes de guardar. Haz clic en "Verificar".');
                    return;
                  }
                  handleSaveProfile(e);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-all font-medium text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Guardar cambios
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre <span className="text-red-500">*</span>
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                required
              />
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                <span className="text-gray-900 font-medium">{user?.firstName}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Apellido <span className="text-red-500">*</span>
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                required
              />
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                <span className="text-gray-900 font-medium">{user?.lastName}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          {emailChangeStep === 'confirming' ? (
            <div>
              <div className="flex items-center gap-2 px-3 py-2.5 border-2 border-brand-400 rounded-xl bg-gradient-to-r from-brand-50 to-white ring-4 ring-brand-100/60">
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-brand-700 max-w-[110px] truncate">{pendingEmailChange}</span>
                </div>
                <div className="w-px h-5 bg-brand-200 shrink-0" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={emailChangeCode}
                  onChange={(e) => setEmailChangeCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="· · · · · ·"
                  className="flex-1 min-w-0 bg-transparent text-center text-base font-mono font-bold tracking-[0.35em] text-gray-800 placeholder:text-gray-300 focus:outline-none"
                  autoFocus
                />
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={handleConfirmEmailChange}
                    disabled={emailChangeCode.length !== 6}
                    className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                    title="Confirmar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onClick={handleCancelEmailChange}
                    className="w-8 h-8 rounded-lg border border-gray-200 text-gray-400 flex items-center justify-center hover:bg-gray-100 hover:text-gray-600 transition-all"
                    title="Cancelar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
                <svg className="w-3 h-3 text-brand-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Ingresa el código de 6 dígitos enviado a tu nuevo correo
              </p>
            </div>
          ) : isEditing ? (
            <div>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`block w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all ${
                    formData.email !== originalEmail ? 'pr-28 border-brand-300 bg-brand-50/40' : 'border-gray-300'
                  }`}
                  required
                />
                {formData.email && formData.email !== originalEmail && (
                  <button
                    onClick={() => handleRequestEmailChange(formData.email)}
                    disabled={emailChangeStep === 'sending'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-700 disabled:opacity-50 transition-all shadow-sm"
                  >
                    {emailChangeStep === 'sending' ? (
                      <>
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Enviando
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Verificar
                      </>
                    )}
                  </button>
                )}
              </div>
              {formData.email && formData.email !== originalEmail && (
                <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Haz clic en <strong className="mx-0.5">Verificar</strong> para confirmar el cambio
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-900 font-medium">{user?.email}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
