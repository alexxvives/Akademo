import { useState, useRef } from 'react';
import { apiClient } from '@/lib/api-client';

interface VerificationParams {
  formData: { email: string; password: string; fullName: string; dni: string; isUnderage: boolean; guardianName: string; guardianDni: string };
  academyId: string;
  setAuthLoading: (v: boolean) => void;
  setAuthError: (v: string | null) => void;
  onRegistered: (data: Record<string, unknown> & { token?: string }) => void;
}

export function useEmailVerification({
  formData, academyId, setAuthLoading, setAuthError, onRegistered,
}: VerificationParams) {
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [verificationError, setVerificationError] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
        // TEMP: log verification code in browser console
        console.log(`[VerificationCode] email=${formData.email} code=${result.data?.code}`);
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
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.fullName.split(' ')[0] || formData.fullName,
          lastName: formData.fullName.split(' ').slice(1).join(' ') || undefined,
          role: 'STUDENT',
          academyId,
          dni: formData.dni || undefined,
          isUnderage: formData.isUnderage,
          guardianName: formData.isUnderage ? (formData.guardianName || undefined) : undefined,
          guardianDni: formData.isUnderage ? (formData.guardianDni || undefined) : undefined,
        }),
      });
      const regResult = await regResponse.json();

      if (regResult.success) {
        if (regResult.data.token) {
          localStorage.setItem('auth_token', regResult.data.token);
        }
        sessionStorage.setItem('akademo_new_user', '1');

        setTimeout(() => {
          onRegistered(regResult.data);
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

  return {
    showVerification, setShowVerification,
    verificationCode, setVerificationCode,
    verificationError, verificationSuccess, verifyingCode,
    inputRefs,
    sendVerificationCode, handleCodeChange, handleKeyDown, handleCodePaste,
  };
}
