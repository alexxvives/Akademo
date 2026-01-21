'use client';

import { useState } from 'react';
import { PasswordInput } from '@/components/ui';
import { apiClient } from '@/lib/api-client';

interface LoginFormProps {
  onSuccess: (role: string) => void;
  onSwitchToRegister: () => void;
  onClose: () => void;
}

export function LoginForm({ onSuccess, onSwitchToRegister, onClose }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorShake, setErrorShake] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiClient('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
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
          onSuccess(role);
        } else {
          console.error('Login response:', result);
          setError('Failed to load user data. Please try again.');
          setErrorShake(true);
          setTimeout(() => setErrorShake(false), 500);
        }
      } else {
        setError(result.error || 'Login failed');
        setErrorShake(true);
        setTimeout(() => setErrorShake(false), 500);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Bienvenido de nuevo</h2>
        <p className="text-gray-600 text-sm mt-1">Inicia sesión en tu cuenta</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
          <PasswordInput
            required
            minLength={8}
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
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
            'Sign In'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?
          <button onClick={onSwitchToRegister} className="ml-1 text-brand-600 hover:text-brand-700 font-medium">
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}
