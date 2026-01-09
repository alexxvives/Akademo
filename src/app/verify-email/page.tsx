'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const regDataParam = searchParams.get('regData');
    
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    } else {
      setError('No se encontró el email. Por favor, vuelve a solicitar la verificación.');
    }

    if (regDataParam) {
      try {
        setRegistrationData(JSON.parse(decodeURIComponent(regDataParam)));
      } catch (e) {
        // No registration data, that's okay
      }
    }
  }, [searchParams]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient('/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      });
      const result = await response.json();

      if (result.success) {
        // If we have registration data, complete the registration
        if (registrationData) {
          const regResponse = await apiClient('/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registrationData),
          });
          const regResult = await regResponse.json();

          if (!regResult.success) {
            setError(regResult.error || 'Error al completar el registro');
            setLoading(false);
            return;
          }
        }

        setSuccess(true);
        // Redirect to the return URL if provided, otherwise to login
        const returnUrl = searchParams.get('returnUrl');
        setTimeout(() => {
          if (returnUrl) {
            router.push(decodeURIComponent(returnUrl));
          } else {
            router.push('/?modal=login');
          }
        }, 2000);
      } else {
        setError(result.error || 'Código de verificación inválido');
      }
    } catch (e) {
      setError('Error de conexión. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient('/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();

      if (result.success) {
        alert('Código de verificación reenviado. Revisa tu email.');
        // For testing: show code in console
        if (result.data.code) {
          console.log('Verification code:', result.data.code);
        }
      } else {
        setError(result.error || 'Error al reenviar el código');
      }
    } catch (e) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Email verificado!</h1>
          <p className="text-gray-600 mb-6">
            Tu email ha sido verificado correctamente. Serás redirigido en breve...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo/AKADEMO_logo_OTHER2.svg" 
              alt="AKADEMO" 
              className="h-12 w-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifica tu email</h1>
          <p className="text-gray-600">
            Hemos enviado un código de 6 dígitos a:
          </p>
          <p className="text-sm font-medium text-gray-900 mt-2">{email}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código de verificación
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              placeholder="000000"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-center text-2xl tracking-widest font-mono"
              required
              autoFocus
            />
            <p className="mt-2 text-xs text-gray-500">
              Ingresa el código de 6 dígitos enviado a tu email
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || verificationCode.length !== 6}
            className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verificando...' : 'Verificar email'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-3">¿No recibiste el código?</p>
          <button
            onClick={handleResendCode}
            disabled={loading}
            className="text-sm font-medium text-gray-900 hover:text-gray-700 underline disabled:opacity-50"
          >
            Reenviar código
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <Link 
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
