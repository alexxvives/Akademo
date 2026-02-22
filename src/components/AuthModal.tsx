'use client';

import { useState, useEffect } from 'react';
import { LoginForm } from './auth/LoginForm';
import { RegisterForm } from './auth/RegisterForm';
import { ForgotPasswordForm } from './auth/ForgotPasswordForm';

interface AuthModalProps {
  mode: 'login' | 'register';
  defaultRole?: string;
  onClose: () => void;
}

export default function AuthModal({ mode, defaultRole, onClose }: AuthModalProps) {
  const [view, setView] = useState<'login' | 'register' | 'forgot'>(mode);

  useEffect(() => {
    setView(mode);
  }, [mode]);

  const handleSuccess = (_role: string) => {
    // Navigation handled by form components
  };

  const switchToLogin = () => {
    setView('login');
    window.history.pushState({}, '', '/?modal=login');
  };

  const switchToRegister = () => {
    setView('register');
    window.history.pushState({}, '', '/?modal=register');
  };

  const switchToForgot = () => {
    setView('forgot');
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

        {view === 'login' && (
          <LoginForm
            onSuccess={handleSuccess}
            onSwitchToRegister={switchToRegister}
            onForgotPassword={switchToForgot}
            onClose={onClose}
          />
        )}
        {view === 'register' && (
          <RegisterForm
            onSuccess={handleSuccess}
            onSwitchToLogin={switchToLogin}
            onClose={onClose}
            defaultRole={defaultRole}
          />
        )}
        {view === 'forgot' && (
          <ForgotPasswordForm onBackToLogin={switchToLogin} />
        )}
      </div>
    </div>
  );
}
