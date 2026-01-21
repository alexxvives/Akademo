'use client';

import { useState, useEffect } from 'react';
import { LoginForm } from './auth/LoginForm';
import { RegisterForm } from './auth/RegisterForm';

interface AuthModalProps {
  mode: 'login' | 'register';
  onClose: () => void;
}

export default function AuthModal({ mode, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(mode === 'login');

  useEffect(() => {
    setIsLogin(mode === 'login');
  }, [mode]);

  const handleSuccess = (role: string) => {
    // Navigation handled by form components
  };

  const switchToLogin = () => {
    setIsLogin(true);
    window.history.pushState({}, '', '/?modal=login');
  };

  const switchToRegister = () => {
    setIsLogin(false);
    window.history.pushState({}, '', '/?modal=register');
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

        {isLogin ? (
          <LoginForm 
            onSuccess={handleSuccess}
            onSwitchToRegister={switchToRegister}
            onClose={onClose}
          />
        ) : (
          <RegisterForm
            onSuccess={handleSuccess}
            onSwitchToLogin={switchToLogin}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
