'use client';

import { useEffect, useState, useRef } from 'react';
import { SkeletonForm } from '@/components/ui/SkeletonLoader';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { PasswordInput } from '@/components/ui';
import Image from 'next/image';

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Class {
  id: string;
  name: string;
  description: string | null;
  academyName: string;
}

type AuthUser = Record<string, unknown>;

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const teacherId = params?.teacherId as string;
  
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [, setCurrentUser] = useState<AuthUser | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Email verification state - inline
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [verificationError, setVerificationError] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Selected class
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [requestSent, _setRequestSent] = useState(false);

  useEffect(() => {
    if (teacherId) {
      loadTeacherData();
      // Don't check auth - this is a public registration page
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId]);

  const _checkAuth = async () => {
    try {
      const response = await apiClient('/auth/me');
      const result = await response.json();
      if (result.success && result.data) {
        setIsLoggedIn(true);
        setCurrentUser(result.data);
      }
    } catch (e) {
      // Not logged in
    }
  };

  const loadTeacherData = async () => {
    try {
      // Use the worker API directly instead of Next.js API route
      const response = await apiClient(`/auth/join/${teacherId}`);
      const result = await response.json();
      
      if (result.success) {
        setTeacher(result.data.teacher);
        setClasses(result.data.classes);
      } else {
        setError(result.error || 'No se encontró el profesor');
      }
    } catch (e) {
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationCode = async () => {
    setAuthLoading(true);
    setAuthError(null);

    try {
      // First check if email already exists
      const checkResponse = await apiClient('/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const checkResult = await checkResponse.json();

      if (checkResult.data?.exists) {
        setAuthError('Este email ya está registrado. Inicia sesión en su lugar.');
        setAuthLoading(false);
        return;
      }

      // Email doesn't exist, proceed with verification
      const response = await apiClient('/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const result = await response.json();

      if (result.success) {
        setShowVerification(true);
        setVerificationCode(['', '', '', '', '', '']);
        setVerificationError(false);
        // Focus first input
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
        // For testing: show code in console
        if (result.data.code) {
        }
      } else {
        setAuthError(result.error || 'Error al enviar código');
      }
    } catch (e) {
      setAuthError('Error de conexión');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    
    const newCode = [...verificationCode];
    newCode[index] = digit;
    setVerificationCode(newCode);
    setVerificationError(false);
    
    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when all 6 digits are entered
    const fullCode = newCode.join('');
    if (fullCode.length === 6) {
      verifyCodeAndRegister(fullCode);
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setVerificationCode(newCode);
      verifyCodeAndRegister(pastedData);
    }
  };

  const verifyCodeAndRegister = async (code: string) => {
    setVerifyingCode(true);
    setVerificationError(false);

    try {
      // Verify email code
      const verifyResponse = await apiClient('/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code }),
      });
      const verifyResult = await verifyResponse.json();

      if (!verifyResult.success) {
        // Show error animation
        setVerificationError(true);
        setVerificationCode(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
        setVerifyingCode(false);
        return;
      }

      // Success - register the user
      setVerificationSuccess(true);
      
      const regResponse = await apiClient('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: 'STUDENT' }),
      });
      const regResult = await regResponse.json();

      if (regResult.success) {
        // Store auth token for API requests
        if (regResult.data.token) {
          localStorage.setItem('auth_token', regResult.data.token);
        }
        
        // Auto-login happened, redirect to class selection
        setTimeout(() => {
          setIsLoggedIn(true);
          setCurrentUser(regResult.data);
          setShowVerification(false);
          setVerificationSuccess(false);
        }, 500);
      } else {
        setAuthError(regResult.error || 'Error al registrarse');
        setVerificationSuccess(false);
        setShowVerification(false);
      }
    } catch (e) {
      setVerificationError(true);
      setVerificationCode(['', '', '', '', '', '']);
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (showLogin) {
        // Login
        const response = await apiClient('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password }),
        });
        const result = await response.json();
        
        if (result.success) {
          // Store auth token for API requests
          if (result.data.token) {
            localStorage.setItem('auth_token', result.data.token);
          }
          
          setIsLoggedIn(true);
          setCurrentUser(result.data);
        } else {
          setAuthError(result.error || 'Credenciales incorrectas');
        }
      } else {
        // Registration with email verification
        await sendVerificationCode();
        return; // Don't set loading to false here
      }
    } catch (e) {
      setAuthError('Error de conexión');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRequestAccess = async () => {
    if (!selectedClassId) return;
    
    setAuthLoading(true);
    setAuthError(null);

    try {
      const response = await apiClient('/requests/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: selectedClassId }),
      });
      const result = await response.json();
      
      if (result.success) {
        // Redirect directly to dashboard
        router.push('/dashboard/student');
      } else {
        setAuthError(result.error || 'Error al solicitar acceso');
      }
    } catch (e) {
      setAuthError('Error de conexión');
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <SkeletonForm />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (requestSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Solicitud Enviada!</h1>
          <p className="text-gray-600 mb-6">
            Tu solicitud de acceso ha sido enviada. El profesor revisará tu solicitud y te dará acceso pronto.
          </p>
          <button
            onClick={() => router.push('/dashboard/student')}
            className="w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium"
          >
            Ir al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image 
              src="/logo/AKADEMO_logo_OTHER2.svg" 
              alt="AKADEMO" 
              width={160}
              height={48}
              className="h-12 w-auto"
            />
          </div>
          <p className="text-gray-600">Únete a las clases de</p>
          {teacher && (
            <p className="text-xl font-semibold text-gray-900 mt-1">
              {teacher.firstName} {teacher.lastName}
            </p>
          )}
        </div>

        {!isLoggedIn ? (
          /* Auth Form */
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                      <input
                        type="text"
                        required={!showLogin}
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        autoComplete="given-name"
                        disabled={showVerification}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                        placeholder="Juan"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                      <input
                        type="text"
                        required={!showLogin}
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        autoComplete="family-name"
                        disabled={showVerification}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                        placeholder="García"
                      />
                    </div>
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
                      <button
                        type="button"
                        onClick={() => { setShowVerification(false); setVerificationCode(['', '', '', '', '', '']); }}
                        className="text-xs text-gray-500 hover:text-gray-700 underline"
                      >
                        Cambiar email
                      </button>
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
                
                {showVerification && !showLogin && (
                  <button
                    type="button"
                    onClick={sendVerificationCode}
                    disabled={authLoading}
                    className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 font-medium disabled:opacity-50"
                  >
                    {authLoading ? 'Enviando...' : 'Reenviar código'}
                  </button>
                )}
              </form>
            </>
          </div>
        ) : (
          /* Class Selection */
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Selecciona una clase</h2>

            {authError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
                {authError}
              </div>
            )}

            <div className="space-y-3 mb-6">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedClassId === cls.id
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                  {cls.description && (
                    <p className="text-sm text-gray-600 mt-1">{cls.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">{cls.academyName}</p>
                </div>
              ))}
              
              {classes.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  Este profesor no tiene clases disponibles actualmente.
                </p>
              )}
            </div>

            <button
              onClick={handleRequestAccess}
              disabled={!selectedClassId || authLoading}
              className="w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {authLoading ? 'Enviando...' : 'Solicitar Acceso'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
