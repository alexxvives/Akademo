'use client';

import { useState, useRef, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface EmailVerificationInputProps {
  email: string;
  onVerified: () => void;
  onChangeEmail: () => void;
}

export function EmailVerificationInput({ email, onVerified, onChangeEmail }: EmailVerificationInputProps) {
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verificationError, setVerificationError] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

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
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (data.success) {
        setVerificationSuccess(true);
        setTimeout(() => {
          onVerified();
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

  const sendVerificationCode = async () => {
    try {
      const res = await apiClient('/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to send verification code');
      }
    } catch (err: any) {
      throw err;
    }
  };

  return (
    <div>
      <div className="relative">
        <input
          type="email"
          required
          value={email}
          disabled
          className="w-full px-3 py-2.5 pr-[220px] border border-gray-200 rounded-lg text-sm transition-all disabled:bg-gray-50 disabled:text-gray-500"
          placeholder="you@example.com"
        />
        
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
      </div>
      
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Código enviado a {email}
        </p>
        <button
          type="button"
          onClick={onChangeEmail}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          Cambiar email
        </button>
      </div>

      {!verificationSuccess && (
        <button
          type="button"
          onClick={sendVerificationCode}
          className="mt-2 w-full py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
        >
          Resend code
        </button>
      )}
    </div>
  );
}
