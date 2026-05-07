import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import type { Teacher, JoinClass, JoinFormData } from './types';

export function useJoinPage() {
  const params = useParams();
  const router = useRouter();
  const teacherId = params?.teacherId as string;
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [academyId, setAcademyId] = useState<string | null>(null);
  const [classes, setClasses] = useState<JoinClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [formData, setFormData] = useState<JoinFormData>({ email: '', password: '', fullName: '', dni: '', isUnderage: false, guardianName: '', guardianDni: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [verificationError, setVerificationError] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [requestSent] = useState(false);
  const toggleClass = (id: string) =>
    setSelectedClassIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('login') === 'true') setShowLogin(true);
  }, []);
  useEffect(() => {
    if (teacherId) {
      loadTeacherData();
      checkAuth();
      localStorage.setItem('akademo_join_origin', `/join/${teacherId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId]);
  const checkAuth = async () => {
    try {
      const response = await apiClient('/auth/me');
      const result = await response.json();
      if (result.success && result.data) {
        const role = result.data.role as string;
        if (role === 'STUDENT') {
          setIsLoggedIn(true);
        } else {
          const roleMap: Record<string, string> = { TEACHER: '/dashboard/teacher', ACADEMY: '/dashboard/academy', ADMIN: '/dashboard/admin' };
          router.push(roleMap[role] || '/dashboard/student');
        }
      }
    } catch {
      // Not logged in
    }
  };
  const loadTeacherData = async () => {
    try {
      const response = await apiClient(`/auth/join/${teacherId}`);
      const result = await response.json();
      if (result.success) {
        setTeacher(result.data.teacher);
        setAcademyId(result.data.teacher.academyId || null);
        setClasses(result.data.classes);
      } else {
        setError(result.error || 'No se encontró el profesor');
      }
    } catch {
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };
  const sendVerificationCode = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
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
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        setAuthError(result.error || 'Error al enviar código');
      }
    } catch {
      setAuthError('Error de conexión');
    } finally {
      setAuthLoading(false);
    }
  };
  const handleCodeChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newCode = [...verificationCode];
    newCode[index] = digit;
    setVerificationCode(newCode);
    setVerificationError(false);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    const fullCode = newCode.join('');
    if (fullCode.length === 6) verifyCodeAndRegister(fullCode);
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
      const verifyResponse = await apiClient('/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code }),
      });
      const verifyResult = await verifyResponse.json();
      if (!verifyResult.success) {
        setVerificationError(true);
        setVerificationCode(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
        setVerifyingCode(false);
        return;
      }
      setVerificationSuccess(true);
      const regResponse = await apiClient('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.fullName.split(' ')[0] || formData.fullName,
          lastName: formData.fullName.split(' ').slice(1).join(' ') || undefined,
          role: 'STUDENT',
          ...(academyId ? { academyId } : {}),
          dni: formData.dni || undefined,
          isUnderage: formData.isUnderage,
          guardianName: formData.isUnderage ? (formData.guardianName || undefined) : undefined,
          guardianDni: formData.isUnderage ? (formData.guardianDni || undefined) : undefined,
        }),
      });
      const regResult = await regResponse.json();
      if (regResult.success) {
        if (regResult.data.token) localStorage.setItem('auth_token', regResult.data.token);
        sessionStorage.setItem('akademo_new_user', '1');
        setTimeout(() => {
          setIsLoggedIn(true);
          setShowVerification(false);
          setVerificationSuccess(false);
        }, 500);
      } else {
        setAuthError(regResult.error || 'Error al registrarse');
        setVerificationSuccess(false);
        setShowVerification(false);
      }
    } catch {
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
        const response = await apiClient('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password }),
        });
        const result = await response.json();
        if (result.success) {
          if (result.data.token) localStorage.setItem('auth_token', result.data.token);
          if (result.data?.suspicionWarning) sessionStorage.setItem('akademo_suspicion_warning', '1');
          const role = result.data.role as string;
          const roleMap: Record<string, string> = { STUDENT: '/dashboard/student', TEACHER: '/dashboard/teacher', ACADEMY: '/dashboard/academy', ADMIN: '/dashboard/admin' };
          router.push(roleMap[role] || '/dashboard/student');
          return;
        } else {
          setAuthError(result.error || 'Credenciales incorrectas');
        }
      } else {
        await sendVerificationCode();
        return;
      }
    } catch {
      setAuthError('Error de conexión');
    } finally {
      setAuthLoading(false);
    }
  };
  const handleRequestAccess = async () => {
    if (selectedClassIds.length === 0) return;
    setAuthLoading(true);
    setAuthError(null);
    try {
      await Promise.all(selectedClassIds.map(classId =>
        apiClient('/requests/student', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ classId }),
        })
      ));
      router.push('/dashboard/student');
    } catch {
      setAuthError('Error de conexión');
    } finally {
      setAuthLoading(false);
    }
  };

  return {
    teacher, classes, loading, error, isLoggedIn, requestSent,
    showLogin, setShowLogin, formData, setFormData, authLoading, authError,
    showVerification, setShowVerification, verificationCode, setVerificationCode,
    verificationError, verificationSuccess, verifyingCode, inputRefs,
    selectedClassIds, toggleClass,
    handleAuth, handleCodeChange, handleCodeKeyDown, handleCodePaste,
    sendVerificationCode, handleRequestAccess,
  };
}
