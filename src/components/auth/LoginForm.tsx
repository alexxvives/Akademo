'use client';

import { useState } from 'react';
import { PasswordInput } from '@/components/ui';
import { apiClient } from '@/lib/api-client';

interface LoginFormProps {
  onSuccess: (role: string) => void;
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
  onClose: () => void;
}

export function LoginForm({ onSuccess, onSwitchToRegister, onForgotPassword, onClose }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorShake, setErrorShake] = useState(false);
  const [suspicionWarning, setSuspicionWarning] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState<{ role: string } | null>(null);

  const doRedirect = (role: string) => {
    window.location.href = `/dashboard/${role}`;
    onSuccess(role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Add 15s timeout for login requests to handle slow/unreliable networks
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await apiClient('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await response.json();

      if (result.success) {
        if (result.data?.token) {
          localStorage.setItem('auth_token', result.data.token);
        }

        if (result.data?.role) {
          const role = result.data.role.toLowerCase();
          const suspicionCount = result.data?.suspicionCount ?? 0;

          // Show warning popup for students with 3+ suspicion flags before redirecting
          if (role === 'student' && suspicionCount >= 3) {
            onClose();
            setPendingRedirect({ role });
            setSuspicionWarning(true);
          } else {
            onClose();
            doRedirect(role);
          }
        } else {
          console.error('Login response:', result);
          setError('Failed to load user data. Please try again.');
          setErrorShake(true);
          setTimeout(() => setErrorShake(false), 500);
        }
      } else {
        setError(result.error || 'Login failed');
        setErrorShake(true);
        setTimeout(() => setErrorShake(false), 500);
      }
    } catch (err) {
      // Differentiate network errors from other failures
      if (err instanceof TypeError && (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('Failed'))) {
        setError('Error de conexión. Comprueba tu conexión a internet e inténtalo de nuevo.');
      } else if (err instanceof DOMException && err.name === 'AbortError') {
        setError('La solicitud tardó demasiado. Inténtalo de nuevo.');
      } else {
        setError('Ha ocurrido un error. Por favor, inténtalo de nuevo.');
      }
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Suspicion Warning Modal */}
      {suspicionWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-red-100">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Alerta de seguridad</h3>
                <p className="text-sm text-red-600 font-medium">Actividad sospechosa detectada en tu cuenta</p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
              <p className="text-sm text-gray-700 leading-relaxed">
                Tu cuenta ha sido identificada por posible <strong>incumplimiento de las normas de uso</strong>: compartir credenciales de acceso o difundir contenido protegido.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed mt-3">
                Tu caso está siendo investigado. Si se confirma el incumplimiento, podrías ser expulsado de la academia.
              </p>
            </div>
            <button
              onClick={() => {
                setSuspicionWarning(false);
                if (pendingRedirect) {
                  doRedirect(pendingRedirect.role);
                }
              }}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Entendido, acceder al dashboard
            </button>
          </div>
        </div>
      )}
      <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Bienvenido de nuevo</h2>
        <p className="text-gray-600 text-sm mt-1">Inicia sesión en tu cuenta</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs text-brand-600 hover:text-brand-700"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <PasswordInput
            required
            minLength={8}
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full px-4 py-3 rounded-lg font-medium text-sm disabled:cursor-not-allowed transition-all ${
            error 
              ? `bg-red-500 hover:bg-red-600 text-white ${errorShake ? 'animate-shake' : ''}` 
              : 'bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Espera por favor...
            </span>
          ) : error ? (
            error
          ) : (
            'Iniciar Sesión'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          ¿No tienes una cuenta?
          <button onClick={onSwitchToRegister} className="ml-1 text-brand-600 hover:text-brand-700 font-medium">
            Registrarse
          </button>
        </p>
      </div>
      </div>
    </>
  );
}
