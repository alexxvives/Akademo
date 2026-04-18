'use client';

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
                <button onClick={handleConfirmEmailChange} disabled={emailChangeCode.length !== 6} className="px-3 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-40">Confirmar</button>
                <button onClick={handleCancelEmailChange} className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
              </div>
            </div>
          ) : isEditing ? (
            <div className="flex gap-2">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                required
              />
              {formData.email && formData.email !== originalEmail && (
                <button
                  onClick={() => handleRequestEmailChange(formData.email)}
                  disabled={emailChangeStep === 'sending'}
                  className="flex-shrink-0 px-3 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-40 whitespace-nowrap"
                >
                  {emailChangeStep === 'sending' ? 'Enviando…' : 'Verificar'}
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
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
