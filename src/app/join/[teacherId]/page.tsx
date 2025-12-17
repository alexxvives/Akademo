'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Selected class
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    if (teacherId) {
      loadTeacherData();
      checkAuth();
    }
  }, [teacherId]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
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
      const response = await fetch(`/api/join/${teacherId}`);
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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (showLogin) {
        // Login
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password }),
        });
        const result = await response.json();
        
        if (result.success) {
          setIsLoggedIn(true);
          setCurrentUser(result.data.user);
        } else {
          setAuthError(result.error || 'Credenciales incorrectas');
        }
      } else {
        // Register as student
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, role: 'STUDENT' }),
        });
        const result = await response.json();
        
        if (result.success) {
          setIsLoggedIn(true);
          setCurrentUser(result.data.user);
          // Re-check auth to ensure session is loaded
          await checkAuth();
        } else {
          setAuthError(result.error || 'Error al registrarse');
        }
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
      const response = await fetch('/api/requests/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: selectedClassId }),
      });
      const result = await response.json();
      
      if (result.success) {
        setRequestSent(true);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
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
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AKADEMO</h1>
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
            <div className="flex mb-6">
              <button
                onClick={() => setShowLogin(true)}
                className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${
                  showLogin ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => setShowLogin(false)}
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                      placeholder="García"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  autoComplete="email"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                  placeholder="tu@email.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  autoComplete={showLogin ? "current-password" : "new-password"}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                  placeholder="••••••••"
                />
              </div>
              
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium disabled:opacity-50"
              >
                {authLoading ? 'Cargando...' : showLogin ? 'Iniciar Sesión' : 'Registrarse'}
              </button>
            </form>
          </div>
        ) : (
          /* Class Selection */
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Selecciona una clase</h2>
            <p className="text-gray-600 mb-6">
              Hola {currentUser?.firstName}, selecciona la clase a la que quieres unirte:
            </p>

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
