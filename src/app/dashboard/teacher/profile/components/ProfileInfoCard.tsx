'use client';

import { useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { User } from '../useTeacherProfile';

interface ProfileInfoCardProps {
  user: User | null;
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  formData: { firstName: string; lastName: string; email: string };
  setFormData: (v: { firstName: string; lastName: string; email: string }) => void;
  handleSaveProfile: (e: React.FormEvent) => void;
  emailChangeStep: 'idle' | 'sending' | 'confirming';
  pendingEmailChange: string | null;
  emailChangeCode: string;
  setEmailChangeCode: Dispatch<SetStateAction<string>>;
  originalEmail: string;
  handleRequestEmailChange: (newEmail: string) => Promise<void>;
  handleConfirmEmailChange: () => Promise<void>;
  handleCancelEmailChange: () => void;
}

export function ProfileInfoCard({
  user,
  isEditing,
  setIsEditing,
  formData,
  setFormData,
  handleSaveProfile,
  emailChangeStep,
  pendingEmailChange,
  emailChangeCode,
  setEmailChangeCode,
  originalEmail,
  handleRequestEmailChange,
  handleConfirmEmailChange,
  handleCancelEmailChange,
}: ProfileInfoCardProps) {
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Card Header */}
      <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
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

      {/* Card Body */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Nombre */}
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

          {/* Apellido */}
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

        {/* Email */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          {emailChangeStep === 'confirming' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={emailChangeCode[i] ?? ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(-1);
                      const newCode = emailChangeCode.slice(0, i) + val + emailChangeCode.slice(i + 1);
                      setEmailChangeCode(newCode);
                      if (val && i < 5) otpRefs.current[i + 1]?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !emailChangeCode[i] && i > 0) {
                        otpRefs.current[i - 1]?.focus();
                      }
                    }}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                      setEmailChangeCode(pasted);
                      otpRefs.current[Math.min(pasted.length, 5)]?.focus();
                      e.preventDefault();
                    }}
                    autoFocus={i === 0}
                    className="w-10 h-12 border-2 border-gray-200 rounded-xl text-center text-lg font-bold text-gray-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none transition-all bg-gray-50 focus:bg-white"
                  />
                ))}
                <div className="flex-1" />
                <button
                  onClick={handleConfirmEmailChange}
                  disabled={emailChangeCode.length !== 6}
                  className="w-10 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                  title="Confirmar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  onClick={handleCancelEmailChange}
                  className="w-10 h-12 rounded-xl bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-sm"
                  title="Cancelar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-400">Código enviado a <span className="font-medium text-gray-600">{pendingEmailChange}</span></p>
            </div>
          ) : isEditing ? (
            <div className="relative">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`block w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all ${
                  formData.email !== originalEmail ? 'pr-28 border-orange-300 bg-orange-50/30' : 'border-gray-300'
                }`}
                required
              />
              {formData.email && formData.email !== originalEmail && (
                <button
                  onClick={() => handleRequestEmailChange(formData.email)}
                  disabled={emailChangeStep === 'sending'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-orange-600 disabled:opacity-50 transition-all shadow-sm"
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
