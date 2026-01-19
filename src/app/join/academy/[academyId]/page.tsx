'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { PasswordInput } from '@/components/ui';

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
  const [currentUser, setCurrentUser] = useState<any>(null);
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
  }, [academyId]);

  const loadAcademyData = async () => {
    try {
      console.log('[Academy Join] Loading academy:', academyId);
      const response = await apiClient(`/auth/join/academy/${academyId}`);
      const result = await response.json();
      
      console.log('[Academy Join] API Response:', result);
      
      if (result.success) {
        console.log('[Academy Join] Success! Academy:', result.data.academy);
        console.log('[Academy Join] Classes:', result.data.classes);
        setAcademy(result.data.academy);
        setClasses(result.data.classes);
      } else {
        console.error('[Academy Join] API returned error:', result.error);
        setError(result.error || 'No se encontró la academia');
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
      const response = await apiClient('/auth/verification/send', {
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

  const verifyCode = async (code: string) => {
    setVerifyingCode(true);
    setVerificationError(false);

    try {
      const verifyResponse = await apiClient('/auth/verification/verify', {
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  if (error || !academy) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error || 'Academia no encontrada'}</div>
          <button
            onClick={() => router.push('/')}
            className="text-[#b1e787] hover:underline"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Academy Header */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{academy.name}</h1>
          {academy.description && (
            <p className="text-gray-300 mb-4">{academy.description}</p>
          )}
          <p className="text-sm text-gray-400">
            Dirigida por: {academy.ownerFirstName} {academy.ownerLastName}
          </p>
        </div>

        {/* Email Verification Modal */}
        {showVerification && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8 max-w-md w-full">
              <h3 className="text-2xl font-bold text-white mb-2 text-center">
                Verifica tu correo
              </h3>
              <p className="text-gray-300 text-center mb-6">
                Ingresa el código de 6 dígitos que enviamos a <strong>{formData.email}</strong>
              </p>
              
              <div className="flex justify-center gap-2 mb-6">
                {verificationCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleCodeChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    disabled={verifyingCode || verificationSuccess}
                    className={`w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 transition-all
                      ${verificationError 
                        ? 'border-red-500 bg-red-500/10' 
                        : verificationSuccess
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-gray-600 bg-gray-700/50'
                      }
                      ${verifyingCode || verificationSuccess ? 'opacity-50' : ''}
                      text-white focus:outline-none focus:border-[#b1e787]`}
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {verificationError && (
                <p className="text-red-400 text-sm text-center mb-4">
                  Código incorrecto. Inténtalo de nuevo.
                </p>
              )}

              {verificationSuccess && (
                <p className="text-green-400 text-sm text-center mb-4">
                  ✓ Código verificado. Creando tu cuenta...
                </p>
              )}

              {verifyingCode && !verificationSuccess && !verificationError && (
                <p className="text-gray-400 text-sm text-center mb-4">
                  Verificando código...
                </p>
              )}

              <button
                onClick={() => {
                  setShowVerification(false);
                  setVerificationCode(['', '', '', '', '', '']);
                  setVerificationError(false);
                }}
                disabled={verifyingCode || verificationSuccess}
                className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {!isLoggedIn ? (
          /* Auth Form */
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              {showLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h2>
            
            <form onSubmit={handleAuth} className="space-y-4">
              {!showLogin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nombre
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-[#b1e787]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Apellido
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-[#b1e787]"
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-[#b1e787]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contraseña
                </label>
                <PasswordInput
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required
                  placeholder=""
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-[#b1e787]"
                />
              </div>
              
              {authError && (
                <div className="text-red-400 text-sm">{authError}</div>
              )}
              
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-[#b1e787] hover:bg-[#9dd46f] text-gray-900 font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {authLoading ? 'Cargando...' : showLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </button>
            </form>
            
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setShowLogin(!showLogin);
                  setAuthError(null);
                }}
                className="text-[#b1e787] hover:underline text-sm"
              >
                {showLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            </div>
          </div>
        ) : (
          /* Class Selection */
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Selecciona una Clase
            </h2>
            
            {classes.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                No hay clases disponibles en esta academia en este momento.
              </p>
            ) : (
              <div className="space-y-4">
                {classes.map(classItem => (
                  <button
                    key={classItem.id}
                    onClick={() => setSelectedClassId(classItem.id)}
                    className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
                      selectedClassId === classItem.id
                        ? 'border-[#b1e787] bg-[#b1e787]/10'
                        : 'border-gray-700 bg-gray-700/30 hover:border-gray-600'
                    }`}
                  >
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {classItem.name}
                    </h3>
                    {classItem.description && (
                      <p className="text-gray-400 text-sm mb-2">
                        {classItem.description}
                      </p>
                    )}
                    <p className="text-gray-500 text-sm">
                      Profesor: {classItem.teacherName}
                    </p>
                  </button>
                ))}
              </div>
            )}
            
            {authError && (
              <div className="text-red-400 text-sm mt-4">{authError}</div>
            )}
            
            {classes.length > 0 && (
              <button
                onClick={handleRequestAccess}
                disabled={!selectedClassId || authLoading}
                className="w-full mt-6 py-3 bg-[#b1e787] hover:bg-[#9dd46f] text-gray-900 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
