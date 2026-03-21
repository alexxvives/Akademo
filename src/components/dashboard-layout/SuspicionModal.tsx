'use client';

import { useEffect } from 'react';

export function SuspicionModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-red-100">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Alerta de seguridad</h3>
            <p className="text-sm text-red-600 font-medium">Actividad sospechosa detectada en tu cuenta</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
          <p className="text-sm text-gray-700 leading-relaxed">
            Tu cuenta ha sido identificada por posible <strong>incumplimiento de las normas de uso</strong>: compartir credenciales de acceso o difundir contenido protegido.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed mt-3">
            Recuerda el documento que firmaste al inscribirte. Si se confirma el incumplimiento, podrías ser expulsado de la academia.
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          Entendido, acceder al dashboard
        </button>
      </div>
    </div>
  );
}
