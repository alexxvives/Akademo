'use client';

import { useEffect, useState, useRef } from 'react';
import { SkeletonForm } from '@/components/ui/SkeletonLoader';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { PasswordInput } from '@/components/ui';
import Image from 'next/image';

interface Academy {
  id: string;
  name: string;
  description: string | null;
  ownerFirstName: string;
  ownerLastName: string;
}

interface Class {
  id: string;
  name: string;
  description: string | null;
  teacherName: string;
}

type AuthUser = Record<string, unknown>;

export default function AcademyJoinPage() {
  const params = useParams();
  const router = useRouter();
  const academyId = params?.academyId as string;
  
  const [academy, setAcademy] = useState<Academy | null>(null);
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

  useEffect(() => {
    if (academyId) {
      loadAcademyData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [academyId]);

  const loadAcademyData = async () => {
    try {
      const response = await apiClient(`/auth/join/academy/${academyId}`);
      
      
      const text = await response.text();
      
      try {
        const result = JSON.parse(text);
        
        if (result.success) {
          setAcademy(result.data.academy);
          setClasses(result.data.classes);
        } else {
          console.error('[Academy Join] API returned error:', result.error);
          setError(result.error || 'No se encontró la academia');
        }
      } catch (parseError) {
        console.error('[Academy Join] JSON parse error:', parseError);
        console.error('[Academy Join] Response was not JSON:', text);
        setError('Error al cargar los datos (respuesta inválida)');
      }
    } catch (e) {
      console.error('[Academy Join] Exception:', e);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationCode = async () => {
    setAuthLoading(true);
    setAuthError(null);

    try {
      const response = await apiClient('/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const result = await response.json();

      if (result.success) {
        setShowVerification(true);
        setAuthError(null);
      } else {
        setAuthError(result.error || 'Error al enviar código de verificación');
      }
    } catch (e) {
      setAuthError('Error de conexión');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    setVerificationError(false);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are entered
    if (index === 5 && value && newCode.every(digit => digit)) {
      verifyCode(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
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
      verifyCode(pastedData);
    }
  };

  const verifyCode = async (code: string) => {
    setVerifyingCode(true);
    setVerificationError(false);

    try {
      const verifyResponse = await apiClient('/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code }),
      });
      const verifyResult = await verifyResponse.json();

      if (!verifyResult.success) {
        setVerificationError(true);
        setVerificationCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
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
        if (regResult.data.token) {
          localStorage.setItem('auth_token', regResult.data.token);
        }
        
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
        return;
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

  if (error || !academy) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{error || 'Academia no encontrada'}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 text-blue-600 hover:underline"
          >
            Volver al inicio
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
          {academy && (
            <p className="text-xl font-semibold text-gray-900 mt-1">
              {academy.name}
            </p>
          )}
        </div>

        {!isLoggedIn ? (
          /* Auth Form */
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-gray-900"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Apellido
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-gray-900"
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
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
        ) : (
          /* Class Selection */
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Selecciona una clase</h2>

            {authError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
                {authError}
              </div>
            )}
            
            {classes.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                No hay clases disponibles en esta academia en este momento.
              </p>
            ) : (
              <div className="space-y-3 mb-6">
                {classes.map(classItem => (
                  <div
                    key={classItem.id}
                    onClick={() => setSelectedClassId(classItem.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedClassId === classItem.id
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {classItem.name}
                        </h3>
                        {classItem.description && (
                          <p className="text-sm text-gray-600 mb-1">
                            {classItem.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          Profesor: {classItem.teacherName}
                        </p>
                      </div>
                      {selectedClassId === classItem.id && (
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {classes.length > 0 && (
              <button
                onClick={handleRequestAccess}
                disabled={!selectedClassId || authLoading}
                className="w-full py-3 bg-gray-900 text-white font-medium rounded-lg transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authLoading ? 'Enviando solicitud...' : 'Solicitar Acceso'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
