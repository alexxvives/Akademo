'use client';

import { useState, useEffect } from 'react';
import { RoleSelector } from './RoleSelector';
import { AcademyFields } from './AcademyFields';
import { StudentTeacherFields } from './StudentTeacherFields';
import { EmailPasswordSection } from './EmailPasswordSection';
import { useRegistrationData } from '@/hooks/useRegistrationData';
import { apiClient } from '@/lib/api-client';

interface RegisterFormProps {
  onSuccess: (role: string) => void;
  onSwitchToLogin: () => void;
  onClose: () => void;
}

export function RegisterForm({ onSuccess, onSwitchToLogin, onClose }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'STUDENT',
    academyId: '',
    classId: '',
    classIds: [] as string[],
    academyName: '',
    monoacademy: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorShake, setErrorShake] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  const {
    academies,
    classes,
    loadingAcademies,
    loadingClasses,
  } = useRegistrationData(formData.role, formData.academyId);

  useEffect(() => {
    if (error) {
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 500);
    }
  }, [error]);

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
    } catch (err: unknown) {
      throw err;
    }
  };

  const proceedWithRegistration = async () => {
    setLoading(true);
    setError('');

    try {
      // Parse full name into firstName and lastName
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';

      const payload = {
        email: formData.email,
        password: formData.password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        role: formData.role,
        academyId: formData.academyId || undefined,
        classId: formData.classId || undefined,
        classIds: formData.classIds.length > 0 ? formData.classIds : undefined,
        academyName: formData.academyName || undefined,
        monoacademy: formData.monoacademy || undefined,
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

        // Mark new user so dashboard fires confetti on first load
        sessionStorage.setItem('akademo_new_user', '1');

        onClose();
        
        if (result.data?.role) {
          const role = result.data.role.toLowerCase();
          window.location.href = `/dashboard/${role}`;
          onSuccess(role);
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
      // Email verification required for all registrations (only STUDENT and ACADEMY allowed)
      if (!showVerification && !verificationSuccess) {
        try {
          await sendVerificationCode();
          setShowVerification(true);
        } catch (err: unknown) {
          // Parse error response properly
          const errorMessage = err instanceof Error ? err.message : 'Failed to send verification code';
          setError(errorMessage);
          console.error('Verification error:', err);
        }
        setLoading(false);
        return;
      }

      if ((formData.role === 'STUDENT' || formData.role === 'ACADEMY') && !verificationSuccess) {
        setError('Por favor verifica tu email primero');
        setLoading(false);
        return;
      }

      await proceedWithRegistration();
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (newRole: string) => {
    setFormData({ ...formData, role: newRole, academyId: '', classId: '', classIds: [], academyName: '' });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Crear cuenta</h2>
        <p className="text-gray-600 text-sm mt-1">Únete a AKADEMO hoy</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <RoleSelector role={formData.role} onChange={handleRoleChange} />

        {formData.role === 'ACADEMY' ? (
          <AcademyFields 
            academyName={formData.academyName}
            monoacademy={formData.monoacademy}
            onAcademyNameChange={(name) => setFormData({ ...formData, academyName: name })}
            onMonoacademyChange={(mono) => setFormData({ ...formData, monoacademy: mono })}
          />
        ) : (
          <StudentTeacherFields
            role={formData.role as 'STUDENT' | 'TEACHER'}
            fullName={formData.fullName}
            academyId={formData.academyId}
            classId={formData.classId}
            classIds={formData.classIds}
            academies={academies}
            classes={classes}
            loadingAcademies={loadingAcademies}
            loadingClasses={loadingClasses}
            onFullNameChange={(name) => setFormData({ ...formData, fullName: name })}
            onAcademyChange={(id) => setFormData({ ...formData, academyId: id, classId: '', classIds: [] })}
            onClassChange={(id) => setFormData({ ...formData, classId: id })}
            onClassIdsChange={(ids) => setFormData({ ...formData, classIds: ids })}
          />
        )}

        <EmailPasswordSection 
          email={formData.email}
          password={formData.password}
          role={formData.role}
          showVerification={showVerification}
          verificationSuccess={verificationSuccess}
          loading={loading}
          error={error}
          errorShake={errorShake}
          onEmailChange={(email) => setFormData({ ...formData, email })}
          onPasswordChange={(password) => setFormData({ ...formData, password })}
          onVerified={() => {
            setVerificationSuccess(true);
            proceedWithRegistration();
          }}
          onChangeEmail={() => {
            setShowVerification(false);
            setVerificationSuccess(false);
          }}
        />
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          ¿Ya tienes una cuenta?
          <button onClick={onSwitchToLogin} className="ml-1 text-brand-600 hover:text-brand-700 font-medium">
            Iniciar Sesión
          </button>
        </p>
      </div>
    </div>
  );
}
