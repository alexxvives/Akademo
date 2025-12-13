'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export default function DashboardLayout({
  children,
  role,
}: {
  children: React.ReactNode;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    
    if (role === 'STUDENT') {
      const interval = setInterval(checkSession, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const result = await response.json();

      if (result.success && result.data.role === role) {
        setUser(result.data);
      } else {
        router.push('/login');
      }
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const checkSession = async () => {
    try {
      const response = await fetch('/api/session/check');
      const result = await response.json();

      if (!result.success || !result.data.valid) {
        if (result.data.message) {
          alert(result.data.message);
        }
        handleLogout();
      }
    } catch (error) {
      console.error('Session check error:', error);
      // Ignore errors - don't log out on network issues
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const roleLabel = role === 'ADMIN' ? 'Admin' : role === 'TEACHER' ? 'Teacher' : 'Student';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Link href={`/dashboard/${role.toLowerCase()}`}>
                <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:bg-brand-600 transition-colors">
                  AH
                </div>
              </Link>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-gray-900">{roleLabel} Dashboard</h1>
              </div>
            </div>

            {/* Desktop nav */}
            <div className="hidden sm:flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <span className="text-sm text-gray-600">{user.email}</span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Logout
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="sm:hidden mt-4 pt-4 border-t border-gray-100">
              {user && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
