'use client';

import { useState } from 'react';
import { PasswordInput } from '@/components/ui';
import { apiClient } from '@/lib/api-client';

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

type Step = 'email' | 'code' | 'password' | 'done';

export function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiClient('/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();
      if (result.success) {
        setStep('code');
      } else {
        setError(result.error || 'Error al enviar el código');
      }
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) { setError('El código debe tener 6 dígitos'); return; }
    setStep('password');
    setError('');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }
    if (newPassword.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await apiClient('/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const result = await res.json();
      if (result.success) {
        setStep('done');
      } else {
        setError(result.error || 'Error al restablecer la contraseña');
        // If code is wrong/expired after navigating back, return to code step
        if (result.error?.includes('xpira') || result.error?.includes('ncorrecto')) {
          setStep('code');
          setCode('');
        }
      }
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Restablecer contraseña</h2>
        <p className="text-gray-600 text-sm mt-1">
          {step === 'email' && 'Introduce tu email y te enviaremos un código'}
          {step === 'code' && `Hemos enviado un código a ${email}`}
          {step === 'password' && 'Escribe tu nueva contraseña'}
          {step === 'done' && '¡Contraseña actualizada correctamente!'}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2 mb-6">
        {(['email', 'code', 'password'] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              step === 'done' || ['email', 'code', 'password'].indexOf(step) > i
                ? 'bg-brand-500'
                : step === s
                ? 'bg-brand-500'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {step === 'email' && (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all"
              placeholder="you@example.com"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 rounded-lg font-medium text-sm bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50 transition-all"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Enviando código...
              </span>
            ) : 'Enviar código'}
          </button>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Código de verificación</label>
            <input
              type="text"
              required
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all tracking-widest text-center text-xl"
              placeholder="000000"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full px-4 py-3 rounded-lg font-medium text-sm bg-gray-900 hover:bg-gray-800 text-white transition-all"
          >
            Verificar código
          </button>
          <button
            type="button"
            onClick={() => { setStep('email'); setError(''); }}
            className="w-full text-sm text-gray-500 hover:text-gray-700"
          >
            Cambiar email
          </button>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nueva contraseña</label>
            <PasswordInput
              required
              minLength={8}
              value={newPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all"
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar contraseña</label>
            <PasswordInput
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all"
              placeholder="Repite la contraseña"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 rounded-lg font-medium text-sm bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50 transition-all"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando...
              </span>
            ) : 'Guardar contraseña'}
          </button>
        </form>
      )}

      {step === 'done' && (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm text-gray-600">Ya puedes iniciar sesión con tu nueva contraseña.</p>
          <button
            onClick={onBackToLogin}
            className="w-full px-4 py-3 rounded-lg font-medium text-sm bg-gray-900 hover:bg-gray-800 text-white transition-all"
          >
            Iniciar sesión
          </button>
        </div>
      )}

      {step !== 'done' && (
        <div className="mt-6 text-center">
          <button onClick={onBackToLogin} className="text-sm text-gray-500 hover:text-gray-700">
            ← Volver al inicio de sesión
          </button>
        </div>
      )}
    </div>
  );
}
