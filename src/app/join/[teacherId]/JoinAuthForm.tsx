import React from 'react';
import { PasswordInput } from '@/components/ui';
import type { JoinFormData } from './types';

interface JoinAuthFormProps {
  showLogin: boolean;
  setShowLogin: (v: boolean) => void;
  showVerification: boolean;
  setShowVerification: (v: boolean) => void;
  authError: string | null;
  formData: JoinFormData;
  setFormData: (d: JoinFormData) => void;
  authLoading: boolean;
  handleAuth: (e: React.FormEvent) => void;
  verificationCode: string[];
  setVerificationCode: (c: string[]) => void;
  verificationError: boolean;
  verificationSuccess: boolean;
  verifyingCode: boolean;
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  handleCodeChange: (index: number, value: string) => void;
  handleCodeKeyDown: (index: number, e: React.KeyboardEvent) => void;
  handleCodePaste: (e: React.ClipboardEvent) => void;
  sendVerificationCode: () => void;
}

export function JoinAuthForm({
  showLogin, setShowLogin, showVerification, setShowVerification,
  authError, formData, setFormData, authLoading, handleAuth,
  verificationCode, setVerificationCode, verificationError,
  verificationSuccess, verifyingCode, inputRefs,
  handleCodeChange, handleCodeKeyDown, handleCodePaste,
  sendVerificationCode,
}: JoinAuthFormProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex mb-6">
        <button
          onClick={() => { setShowLogin(true); setShowVerification(false); }}
          className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${
            showLogin ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500'
          }`}
        >
          Iniciar Sesión
        </button>
        <button
          onClick={() => { setShowLogin(false); setShowVerification(false); }}
          className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${
            !showLogin ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500'
          }`}
        >
          Registrarse
        </button>
      </div>

      {authError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
          {authError}
        </div>
      )}

      <form onSubmit={handleAuth} className="space-y-4">
        {!showLogin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
            <input
              type="text"
              required={!showLogin}
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              autoComplete="name"
              disabled={showVerification}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="Juan García"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <div className="relative">
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              autoComplete="email"
              disabled={showVerification}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-500 ${
                showVerification ? 'pr-[220px] border-gray-200' : 'border-gray-200'
              }`}
              placeholder="tu@email.com"
            />

            {/* Inline Verification Code Input */}
            {showVerification && !showLogin && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <div className={`flex gap-0.5 p-1 rounded-lg transition-all ${
                  verificationError ? 'animate-shake bg-red-50' :
                  verificationSuccess ? 'bg-green-50' : 'bg-gray-50'
                }`}>
                  {verificationCode.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(index, e)}
                      onPaste={index === 0 ? handleCodePaste : undefined}
                      disabled={verifyingCode || verificationSuccess}
                      className={`w-7 h-8 text-center text-sm font-bold border rounded transition-all focus:outline-none focus:ring-1 ${
                        verificationError
                          ? 'border-red-400 bg-red-50 text-red-600 focus:ring-red-400'
                          : verificationSuccess
                            ? 'border-green-400 bg-green-50 text-green-600'
                            : 'border-gray-300 focus:ring-gray-900 focus:border-gray-900'
                      }`}
                    />
                  ))}
                </div>
                {verifyingCode && (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                )}
                {verificationSuccess && (
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            )}
          </div>

          {/* Verification hint text */}
          {showVerification && !showLogin && (
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Código enviado a {formData.email}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={sendVerificationCode}
                  disabled={authLoading}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
                >
                  {authLoading ? 'Enviando...' : 'Reenviar código'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowVerification(false); setVerificationCode(['', '', '', '', '', '']); }}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Cambiar email
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
          <PasswordInput
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="••••••••"
          />
        </div>

        {!showVerification && (
          <button
            type="submit"
            disabled={authLoading}
            className="w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium disabled:opacity-50"
          >
            {authLoading ? 'Cargando...' : showLogin ? 'Iniciar Sesión' : 'Continuar'}
          </button>
        )}
      </form>
    </div>
  );
}
