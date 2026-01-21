'use client';

import { PasswordInput } from '@/components/ui';
import { EmailVerificationInput } from './EmailVerificationInput';

interface EmailPasswordSectionProps {
  email: string;
  password: string;
  role: string;
  showVerification: boolean;
  verificationSuccess: boolean;
  loading: boolean;
  error: string;
  errorShake: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onVerified: () => void;
  onChangeEmail: () => void;
}

export function EmailPasswordSection({
  email,
  password,
  role,
  showVerification,
  verificationSuccess,
  loading,
  error,
  errorShake,
  onEmailChange,
  onPasswordChange,
  onVerified,
  onChangeEmail,
}: EmailPasswordSectionProps) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
        {showVerification && role === 'STUDENT' ? (
          <EmailVerificationInput
            email={email}
            onVerified={onVerified}
            onChangeEmail={onChangeEmail}
          />
        ) : (
          <input
            type="email"
            required
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all"
            placeholder="you@example.com"
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
        <PasswordInput
          required
          minLength={8}
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onPasswordChange(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all"
          placeholder="••••••••"
        />
        <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
      </div>

      <button
        type="submit"
        disabled={loading || (role === 'STUDENT' && showVerification && !verificationSuccess)}
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
            {role === 'STUDENT' && showVerification && !verificationSuccess 
              ? 'Verify email to continue' 
              : 'Create Account'}
          </>
        )}
      </button>
    </>
  );
}
