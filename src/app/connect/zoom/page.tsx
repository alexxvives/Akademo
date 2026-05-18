'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

type Status = 'loading' | 'not-academy' | 'ready' | 'already-connected';

interface ZoomAccount {
  id: string;
  accountName: string;
}

export default function ConnectZoomPage() {
  const [status, setStatus] = useState<Status>('loading');
  const [accounts, setAccounts] = useState<ZoomAccount[]>([]);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await apiClient('/zoom-accounts');
        if (!res.ok) {
          // Not authenticated — middleware already redirected; this fallback
          // handles edge cases where cookie exists but session is invalid.
          window.location.href = '/?modal=login&next=/connect/zoom';
          return;
        }
        const data = await res.json();
        if (data.success) {
          setAccounts(data.data || []);
          setStatus((data.data || []).length > 0 ? 'already-connected' : 'ready');
        } else {
          setStatus('not-academy');
        }
      } catch {
        window.location.href = '/?modal=login&next=/connect/zoom';
      }
    };
    check();
  }, []);

  const handleConnect = () => {
    const clientId = 'W2jPo9CJR0uZbFnEWtBF7Q';
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/zoom/oauth/callback`);
    window.location.href = `https://zoom.us/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=connect-zoom-page`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8">
        {/* Logos */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <img src="/logo/akademo-logo.png" alt="Akademo" className="h-10 object-contain" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          <span className="text-2xl text-gray-300 font-light">+</span>
          <svg className="h-10" viewBox="0 0 118 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.163 0 0 7.163 0 16s7.163 16 16 16 16-7.163 16-16S24.837 0 16 0zm8 22.4L10.4 16 24 9.6V22.4z" fill="#2D8CFF"/>
            <text x="36" y="24" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="22" fill="#2D8CFF">Zoom</text>
          </svg>
        </div>

        {status === 'loading' && (
          <div className="text-center text-gray-500">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p>Verificando sesión...</p>
          </div>
        )}

        {status === 'not-academy' && (
          <div className="text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Acceso restringido</h2>
            <p className="text-gray-600 text-sm">La integración con Zoom solo está disponible para cuentas de academia. Inicia sesión con una cuenta de academia para continuar.</p>
            <a href="/dashboard/academy/profile" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Ir a mi perfil</a>
          </div>
        )}

        {status === 'ready' && (
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Conectar Zoom</h2>
            <p className="text-gray-600 text-sm mb-6">
              Autoriza a Akademo a gestionar reuniones y grabaciones de Zoom en nombre de tu academia. Podrás crear clases en directo y recuperar grabaciones automáticamente.
            </p>
            <button
              onClick={handleConnect}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6 16.8L8.4 12 18 7.2V16.8z"/>
              </svg>
              Autorizar con Zoom
            </button>
            <p className="mt-4 text-xs text-gray-400">
              Al autorizar, aceptas los <a href="/terminos" className="underline">Términos de Servicio</a> y la <a href="/privacidad" className="underline">Política de Privacidad</a> de Akademo.
            </p>
          </div>
        )}

        {status === 'already-connected' && (
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Zoom ya está conectado</h2>
            <div className="space-y-2 mb-6">
              {accounts.map(acc => (
                <div key={acc.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6 16.8L8.4 12 18 7.2V16.8z"/></svg>
                  {acc.accountName}
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <a href="/dashboard/academy/profile" className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 text-center">Gestionar cuentas</a>
              <button onClick={handleConnect} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Añadir otra cuenta</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
