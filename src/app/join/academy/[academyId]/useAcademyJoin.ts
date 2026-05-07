import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useEmailVerification } from './useEmailVerification';
import type { Academy, Class, AuthUser } from './types';

export function useAcademyJoin() {
  const params = useParams();
  const router = useRouter();
  const academyId = params?.academyId as string;

  const [academy, setAcademy] = useState<Academy | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  // Pre-select login tab if redirected from logout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('login') === 'true') setShowLogin(true);
  }, []);

  // Skip class selection — redirect non-students to their dashboard when logged in
  // Students stay on this page to complete class selection; handleRequestAccess handles their redirect.
  useEffect(() => {
    if (!isLoggedIn || !currentUser) return;
    const role = (currentUser as Record<string, string>).role?.toLowerCase();
    if (role === 'academy') router.push('/dashboard/academy');
    else if (role === 'teacher') router.push('/dashboard/teacher');
    else if (role === 'admin') router.push('/dashboard/admin');
  }, [isLoggedIn, currentUser, router]);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    dni: '',
    isUnderage: false,
    guardianName: '',
    guardianDni: '',
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Email verification (extracted hook)
  const verification = useEmailVerification({
    formData,
    academyId,
    setAuthLoading,
    setAuthError,
    onRegistered: (data) => {
      setIsLoggedIn(true);
      setCurrentUser(data as AuthUser);
    },
  });

  // Selected classes (multi-select)
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const toggleClass = (id: string) =>
    setSelectedClassIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  useEffect(() => {
    if (academyId) {
      loadAcademyData();
      checkAuth();
      // Store this join origin so logout can redirect back here
      localStorage.setItem('akademo_join_origin', `/join/academy/${academyId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [academyId]);

  const checkAuth = async () => {
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
          if (result.data?.suspicionWarning) {
            sessionStorage.setItem('akademo_suspicion_warning', '1');
          }
          router.push('/dashboard/student');
          return;
        } else {
          setAuthError(result.error || 'Credenciales incorrectas');
        }
      } else {
        // Registration with email verification
        await verification.sendVerificationCode();
        return;
      }
    } catch (e) {
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
      await Promise.all(
        selectedClassIds.map(classId =>
          apiClient('/requests/student', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ classId }),
          })
        )
      );
      router.push('/dashboard/student');
    } catch (e) {
      setAuthError('Error de conexión');
    } finally {
      setAuthLoading(false);
    }
  };

  return {
    academy, loading, error, isLoggedIn, router,
    authFormProps: {
      showLogin, setShowLogin,
      formData, setFormData,
      authLoading, authError, setAuthError,
      ...verification,
      handleAuth,
    },
    classSelectionProps: {
      classes, selectedClassIds, toggleClass,
      authLoading, authError, handleRequestAccess,
    },
  };
}
