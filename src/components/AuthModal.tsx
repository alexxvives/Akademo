'use client';

import { useState, useEffect, useRef } from 'react';
import { PasswordInput } from './ui';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface AuthModalProps {
  mode: 'login' | 'register';
  onClose: () => void;
}

interface Academy {
  id: string;
  name: string;
  description: string | null;
}

interface Class {
  id: string;
  name: string;
  description: string | null;
  teacherName: string | null;
}

export default function AuthModal({ mode, onClose }: AuthModalProps) {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    academyName: '', // For ACADEMY role
    monoacademy: false, // For ACADEMY role - owner is also the only teacher
    role: 'STUDENT' as 'STUDENT' | 'TEACHER' | 'ACADEMY',
    academyId: '',
    classId: '',
    classIds: [] as string[],
  });

  // Email verification for STUDENT signup
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verificationError, setVerificationError] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [errorShake, setErrorShake] = useState(false);

  // Trigger shake animation when error changes and auto-clear after 3 seconds
  useEffect(() => {
    if (error) {
      setErrorShake(true);
      const shakeTimer = setTimeout(() => setErrorShake(false), 500);
      const clearTimer = setTimeout(() => setError(''), 3000);
      return () => {
        clearTimeout(shakeTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [error]);

  // Load academies and classes for signup
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loadingAcademies, setLoadingAcademies] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Load academies when role is student or teacher
  useEffect(() => {
    console.log('[AuthModal] Role changed:', formData.role, 'isLogin:', isLogin);
    if (!isLogin && (formData.role === 'STUDENT' || formData.role === 'TEACHER')) {
      console.log('[AuthModal] Loading academies...');
      loadAcademies();
    }
  }, [isLogin, formData.role]);

  // Load classes when academy is selected
  useEffect(() => {
    if (!isLogin && formData.academyId && (formData.role === 'STUDENT' || formData.role === 'TEACHER')) {
      loadClasses(formData.academyId);
    } else {
      setClasses([]);
    }
  }, [isLogin, formData.academyId, formData.role]);

  const loadAcademies = async () => {
    setLoadingAcademies(true);
    console.log('[AuthModal] Fetching academies from API...');
    try {
      // Add cache busting and publicMode to ensure fresh data for signup
      const timestamp = Date.now();
      const url = `/academies?publicMode=true&t=${timestamp}`;
      console.log('[AuthModal] URL:', url);
      const res = await apiClient(url);
      console.log('[AuthModal] API response status:', res.status);
      const result = await res.json();
      console.log('[AuthModal] API result:', result);
      if (result.success) {
        console.log('[AuthModal] Setting academies:', result.data?.length || 0, 'items');
        console.log('[AuthModal] Academies data:', result.data);
        setAcademies(result.data || []);
      } else {
        console.error('[AuthModal] API returned success=false:', result.error);
      }
    } catch (error) {
      console.error('[AuthModal] Failed to load academies:', error);
    } finally {
      setLoadingAcademies(false);
    }
  };

  const loadClasses = async (academyId: string) => {
    setLoadingClasses(true);
    try {
      const res = await apiClient(`/academies/${academyId}/classes`);
      const result = await res.json();
      if (result.success) {
        setClasses(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setLoadingClasses(false);
    }
  };

  const sendVerificationCode = async () => {
    try {
      const res = await apiClient('/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to send verification code');
      }
      return true;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to send verification code');
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (newCode.every(d => d)) {
      verifyCode(newCode.join(''));
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    if (pastedData.every(char => /\d/.test(char))) {
      const newCode = [...verificationCode];
      pastedData.forEach((char, idx) => {
        if (idx < 6) newCode[idx] = char;
      });
      setVerificationCode(newCode);
      if (pastedData.length === 6) {
        verifyCode(newCode.join(''));
      }
    }
  };

  const verifyCode = async (code: string) => {
    setVerifyingCode(true);
    setVerificationError(false);
    try {
      const res = await apiClient('/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code }),
      });
      const data = await res.json();
      if (data.success) {
        setVerificationSuccess(true);
        // Automatically proceed to registration after 500ms delay
        setTimeout(() => {
          proceedWithRegistration();
        }, 500);
      } else {
        setVerificationError(true);
        setVerificationCode(['', '', '', '', '', '']);
        setTimeout(() => setVerificationError(false), 500);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setVerificationError(true);
      setVerificationCode(['', '', '', '', '', '']);
      setTimeout(() => setVerificationError(false), 500);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifyingCode(false);
    }
  };

  const proceedWithRegistration = async () => {
    setLoading(true);
    setError('');

    try {
      // Construct the proper registration payload
      const payload = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        academyId: formData.academyId,
        classId: formData.classId,
        classIds: formData.classIds,
        academyName: formData.academyName,
      };

      const response = await apiClient('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        if (result.data?.token) {
          localStorage.setItem('auth_token', result.data.token);
        }

        onClose();
        
        if (result.data?.role) {
          const role = result.data.role.toLowerCase();
          window.location.href = `/dashboard/${role}`;
        } else {
          console.error('Registration response:', result);
          setError('Failed to load user data. Please try again.');
        }
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // For STUDENT signup, trigger email verification first
      if (!isLogin && formData.role === 'STUDENT' && !showVerification && !verificationSuccess) {
        try {
          await sendVerificationCode();
          setShowVerification(true);
          setTimeout(() => inputRefs.current[0]?.focus(), 100);
        } catch (err: any) {
          setError(err.message || 'Failed to send verification code');
        }
        setLoading(false);
        return;
      }

      // For STUDENT signup, require verified email
      if (!isLogin && formData.role === 'STUDENT' && !verificationSuccess) {
        setError('Please verify your email first');
        setLoading(false);
        return;
      }

      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await apiClient(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        // Save token for cross-domain auth if present
        if (result.data?.token) {
          localStorage.setItem('auth_token', result.data.token);
        }

        onClose();
        
        // Redirect based on role from API response
        if (result.data?.role) {
          const role = result.data.role.toLowerCase();
          window.location.href = `/dashboard/${role}`;
        } else {
          console.error('Login response:', result);
          setError('Failed to load user data. Please try again.');
        }
      } else {
        setError(result.error || `${isLogin ? 'Login' : 'Registration'} failed`);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setShowVerification(false);
    setVerificationCode(['', '', '', '', '', '']);
    setVerificationSuccess(false);
    setVerificationError(false);
    window.history.pushState({}, '', isLogin ? '/?modal=register' : '/?modal=login');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isLogin ? 'Bienvenido de nuevo' : 'Crear cuenta'}
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            {isLogin ? 'Inicia sesión en tu cuenta' : 'Únete a AKADEMO hoy'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de cuenta</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'STUDENT', academyId: '', classId: '', classIds: [], academyName: '' })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      formData.role === 'STUDENT'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Estudiante
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'TEACHER', academyId: '', classId: '', classIds: [], academyName: '' })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      formData.role === 'TEACHER'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Profesor
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'ACADEMY', academyId: '', classId: '', classIds: [], academyName: '' })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      formData.role === 'ACADEMY'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Academia
                  </button>
                </div>
                {formData.role === 'ACADEMY' && (
                  <p className="text-xs text-gray-500 mt-2">Tu academia necesitará aprobación del administrador</p>
                )}
              </div>

              {formData.role === 'ACADEMY' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de la Academia</label>
                    <input
                      type="text"
                      required
                      value={formData.academyName}
                      onChange={(e) => setFormData({ ...formData, academyName: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all"
                      placeholder="Academia de Matemáticas"
                    />
                  </div>
                  
                  {/* MonoAcademy Toggle - Slick toggle switch */}
                  <div className="flex items-center justify-between gap-4 py-1">
                    <div className="flex-1">
                      <label htmlFor="monoacademy-toggle" className="text-sm text-gray-700 cursor-pointer">
                        Soy el único profesor de la academia
                      </label>
                      <p className="text-xs text-gray-500 mt-0.5">Podrás cambiar entre ambas cuentas fácilmente</p>
                    </div>
                    <button
                      type="button"
                      id="monoacademy-toggle"
                      role="switch"
                      aria-checked={formData.monoacademy}
                      onClick={() => setFormData({ ...formData, monoacademy: !formData.monoacademy })}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        formData.monoacademy ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          formData.monoacademy ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all"
                      placeholder="Juan"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Apellido</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all"
                      placeholder="Pérez"
                    />
                  </div>
                </div>
              )}

              {/* Academy Selection for Students and Teachers */}
              {(formData.role === 'STUDENT' || formData.role === 'TEACHER') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Academia {academies.length > 0 && <span className="text-gray-500">({academies.length} disponibles)</span>}
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={formData.academyId}
                      onChange={(e) => setFormData({ ...formData, academyId: e.target.value, classId: '', classIds: [] })}
                      className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all appearance-none bg-white"
                      disabled={loadingAcademies}
                    >
                      <option value="">Selecciona una academia</option>
                      {academies.map(academy => (
                        <option key={academy.id} value={academy.id}>{academy.name}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {loadingAcademies && <p className="text-xs text-gray-500 mt-1">Cargando academias...</p>}
                  {!loadingAcademies && academies.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">No hay academias disponibles. Por favor contacta al administrador.</p>
                  )}
                </div>
              )}

              {/* Class Selection for Students */}
              {formData.role === 'STUDENT' && formData.academyId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Clase {classes.length > 0 && <span className="text-gray-500">({classes.length} disponibles)</span>}
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={formData.classId}
                      onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                      className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all appearance-none bg-white"
                      disabled={loadingClasses}
                    >
                      <option value="">Selecciona una clase</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} {cls.teacherName ? `(${cls.teacherName})` : ''}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {loadingClasses && <p className="text-xs text-gray-500 mt-1">Cargando clases...</p>}
                  <p className="text-xs text-gray-500 mt-1">Necesitarás aprobación del profesor</p>
                </div>
              )}

              {/* Class Selection for Teachers (multi-select) */}
              {formData.role === 'TEACHER' && formData.academyId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Clases a enseñar</label>
                  <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                    {loadingClasses ? (
                      <p className="text-xs text-gray-500">Cargando clases...</p>
                    ) : classes.length === 0 ? (
                      <p className="text-xs text-gray-500">No hay clases disponibles</p>
                    ) : (
                      classes.map(cls => (
                        <label key={cls.id} className="flex items-center gap-2 py-1.5 hover:bg-gray-50 rounded px-2">
                          <input
                            type="checkbox"
                            checked={formData.classIds.includes(cls.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, classIds: [...formData.classIds, cls.id] });
                              } else {
                                setFormData({ ...formData, classIds: formData.classIds.filter(id => id !== cls.id) });
                              }
                            }}
                            className="rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{cls.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Selecciona al menos una. Necesitarás aprobación de la academia.</p>
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <div className="relative">
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={showVerification && formData.role === 'STUDENT' && !isLogin}
                className={`w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all ${
                  showVerification && formData.role === 'STUDENT' && !isLogin ? 'pr-[220px] disabled:bg-gray-50 disabled:text-gray-500' : ''
                }`}
                placeholder="you@example.com"
              />
              
              {/* Inline Verification Code Input for STUDENT signup */}
              {showVerification && formData.role === 'STUDENT' && !isLogin && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <div className={`flex gap-0.5 p-1 rounded-lg transition-all ${
                    verificationError ? 'animate-shake bg-red-50' : 
                    verificationSuccess ? 'bg-green-50' : 'bg-gray-50'
                  }`}>
                    {verificationCode.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { if (inputRefs.current) inputRefs.current[index] = el; }}
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
                              : 'border-gray-300 focus:ring-brand-500 focus:border-brand-500'
                        }`}
                      />
                    ))}
                  </div>
                  {verifyingCode && (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin"></div>
                  )}
                  {verificationSuccess && (
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              )}
            </div>
            
            {/* Verification hint text for STUDENT signup */}
            {showVerification && formData.role === 'STUDENT' && !isLogin && (
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Código enviado a {formData.email}
                </p>
                <button
                  type="button"
                  onClick={() => { 
                    setShowVerification(false); 
                    setVerificationCode(['', '', '', '', '', '']);
                    setVerificationSuccess(false);
                    setVerificationError(false);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Cambiar email
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <PasswordInput
              required
              minLength={8}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all"
              placeholder="••••••••"
            />
            {!isLogin && <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>}
          </div>

          <button
            type="submit"
            disabled={loading || (formData.role === 'STUDENT' && !isLogin && showVerification && !verificationSuccess)}
            className={`w-full px-4 py-3 rounded-lg font-medium text-sm disabled:cursor-not-allowed transition-all ${
              error 
                ? `bg-red-500 hover:bg-red-600 text-white ${errorShake ? 'animate-shake' : ''}` 
                : 'bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Please wait...
              </span>
            ) : error ? (
              error
            ) : (
              <>
                {!isLogin && formData.role === 'STUDENT' && showVerification && !verificationSuccess 
                  ? 'Verify email to continue' 
                  : isLogin 
                    ? 'Sign In' 
                    : 'Create Account'
                }
              </>
            )}
          </button>

          {/* Resend code button for STUDENT verification */}
          {!isLogin && formData.role === 'STUDENT' && showVerification && !verificationSuccess && (
            <button
              type="button"
              onClick={sendVerificationCode}
              disabled={loading}
              className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 font-medium disabled:opacity-50"
            >
              Resend code
            </button>
          )}
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button onClick={switchMode} className="ml-1 text-brand-600 hover:text-brand-700 font-medium">
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
