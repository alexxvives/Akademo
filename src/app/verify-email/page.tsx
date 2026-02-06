'use client';

import { useEffect, useState, Suspense } from 'react';
import { SkeletonForm } from '@/components/ui/SkeletonLoader';
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
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [returnUrl, setReturnUrl] = useState<string | null>(null);

  // Extract teacherId from returnUrl (e.g., /join/teacher1 -> teacher1)
  const getJoinUrl = () => {
    if (returnUrl && returnUrl.startsWith('/join/')) {
      return returnUrl;
    }
    return '/';
  };

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const returnUrlParam = searchParams.get('returnUrl');
    
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    } else {
      setError('No se encontró el email. Por favor, vuelve a solicitar la verificación.');
    }
    
    if (returnUrlParam) {
      setReturnUrl(decodeURIComponent(returnUrlParam));
    }

    // Get registration data from sessionStorage (secure - not in URL)
    const storedRegData = sessionStorage.getItem('pendingRegistration');
    if (storedRegData) {
      try {
        setRegistrationData(JSON.parse(storedRegData));
      } catch (e) {
        // Invalid stored data
      }
    } else {
      // Fallback: check URL params for backwards compatibility (deprecated)
      const regDataParam = searchParams.get('regData');
      if (regDataParam) {
        try {
          setRegistrationData(JSON.parse(decodeURIComponent(regDataParam)));
        } catch (e) {
          // No registration data
        }
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
        // If we have registration data, complete the registration and auto-login
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

          // Clear the stored registration data
          sessionStorage.removeItem('pendingRegistration');

          // The register endpoint already logs the user in (sets cookie)
          // So the user is now authenticated
        }

        // Redirect immediately to the return URL or student dashboard
        const returnUrl = searchParams.get('returnUrl');
        if (returnUrl) {
          router.push(decodeURIComponent(returnUrl));
        } else {
          // User is already logged in after registration, go to dashboard
          router.push('/dashboard/student');
        }
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
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-red-600 font-medium mb-2">{error}</p>
                {error.toLowerCase().includes('email') && !error.includes('código') && (
                  <div className="mt-3 p-3 bg-white border border-red-200 rounded-lg">
                    <p className="text-xs text-gray-700 font-semibold mb-2">¿Tu email rebotó o es incorrecto?</p>
                    <p className="text-xs text-gray-600 mb-3">Si no puedes recibir emails en esta dirección, puedes regresar y usar un email diferente.</p>
                    <Link 
                      href={getJoinUrl()}
                      className="inline-flex items-center gap-1 text-xs font-medium text-red-700 hover:text-red-800 underline"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Actualizar dirección de email
                    </Link>
                  </div>
                )}
              </div>
            </div>
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
            href={getJoinUrl()}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Cambiar dirección de email
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
        <SkeletonForm />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
