'use client';

import { PasswordInput } from '@/components/ui';
import type { MutableRefObject } from 'react';

export interface AuthFormProps {
  showLogin: boolean;
  setShowLogin: (v: boolean) => void;
  formData: { email: string; password: string; fullName: string; dni: string; isUnderage: boolean; guardianName: string; guardianDni: string };
  setFormData: (v: { email: string; password: string; fullName: string; dni: string; isUnderage: boolean; guardianName: string; guardianDni: string }) => void;
  authLoading: boolean;
  authError: string | null;
  setAuthError: (v: string | null) => void;
  handleAuth: (e: React.FormEvent) => Promise<void>;
  // Verification props (from useEmailVerification)
  showVerification: boolean;
  setShowVerification: (v: boolean) => void;
  verificationCode: string[];
  setVerificationCode: (v: string[]) => void;
  verificationError: boolean;
  verificationSuccess: boolean;
  verifyingCode: boolean;
  inputRefs: MutableRefObject<(HTMLInputElement | null)[]>;
  handleCodeChange: (index: number, value: string) => void;
  handleKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleCodePaste: (e: React.ClipboardEvent) => void;
  sendVerificationCode: () => Promise<void>;
}

export function AuthForm({
  showLogin, setShowLogin,
  formData, setFormData,
  authLoading, authError, setAuthError,
  showVerification, setShowVerification,
  verificationCode, setVerificationCode,
  verificationError, verificationSuccess, verifyingCode,
  inputRefs,
  handleAuth, handleCodeChange, handleKeyDown, handleCodePaste,
  sendVerificationCode,
}: AuthFormProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <>
        <div className="flex mb-6">
          <button
            type="button"
            onClick={() => { setShowLogin(true); setShowVerification(false); setAuthError(null); }}
            className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${
              showLogin ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setShowLogin(false); setShowVerification(false); setAuthError(null); }}
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
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre completo
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  disabled={showVerification || verifyingCode || verificationSuccess}
                  placeholder="Juan García"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DNI / NIE
                </label>
                <input
                  type="text"
                  value={formData.dni}
                  onChange={e => setFormData({ ...formData, dni: e.target.value })}
                  disabled={showVerification || verifyingCode || verificationSuccess}
                  placeholder="12345678A"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => !showVerification && !verifyingCode && !verificationSuccess && setFormData({ ...formData, isUnderage: !formData.isUnderage })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                    formData.isUnderage ? 'bg-gray-900' : 'bg-gray-200'
                  } disabled:opacity-50`}
                  aria-checked={formData.isUnderage}
                  role="switch"
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                      formData.isUnderage ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-sm font-medium text-gray-700">Soy menor de edad</span>
              </div>

              {formData.isUnderage && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre completo del representante
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.guardianName}
                      onChange={e => setFormData({ ...formData, guardianName: e.target.value })}
                      disabled={showVerification || verifyingCode || verificationSuccess}
                      placeholder="María García López"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      DNI del representante
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.guardianDni}
                      onChange={e => setFormData({ ...formData, guardianDni: e.target.value })}
                      disabled={showVerification || verifyingCode || verificationSuccess}
                      placeholder="87654321B"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <input
                type="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                disabled={showVerification || verifyingCode || verificationSuccess}
                className={`w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-500 transition-all ${
                  showVerification ? 'pr-[220px]' : ''
                }`}
              />
              {showVerification && !showLogin && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <div className={`flex items-center gap-0.5 px-2 py-1 rounded transition-all ${
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
                        onKeyDown={(e) => handleKeyDown(index, e)}
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
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <PasswordInput
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder=""
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-gray-900"
            />
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="w-full py-3 bg-gray-900 text-white font-semibold rounded-lg transition-colors hover:bg-gray-800 disabled:opacity-50"
          >
            {authLoading ? 'Cargando...' : showLogin ? 'Iniciar Sesión' : 'Continuar'}
          </button>
        </form>
      </>
    </div>
  );
}
