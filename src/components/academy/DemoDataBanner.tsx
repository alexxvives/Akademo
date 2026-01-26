'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

export function DemoDataBanner() {
  const [academyId, setAcademyId] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Get academy ID and user email
    const fetchData = async () => {
      try {
        const [academyRes, userRes] = await Promise.all([
          apiClient('/academies'),
          apiClient('/auth/me')
        ]);
        
        const academyResult = await academyRes.json();
        const userResult = await userRes.json();
        
        if (academyResult.success && academyResult.data?.[0]?.id) {
          setAcademyId(academyResult.data[0].id);
        }
        
        if (userResult.success && userResult.data?.email) {
          setUserEmail(userResult.data.email);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const handleActivateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowModal(true);
  };

  const handleConfirm = () => {
    setShowModal(false);
    // Stripe Payment Link with success_url to redirect back to AKADEMO dashboard after payment
    const successUrl = encodeURIComponent('https://akademo-edu.com/dashboard/academy?payment=success');
    window.location.href = `https://buy.stripe.com/test_aFa14m20ndS212ReGr77O01?success_url=${successUrl}`;
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  return (
    <>
      <div className="sticky top-0 z-50 bg-gradient-to-r from-red-600 to-red-700 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-1.5 flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">
                  Modo de Demostración Activo
                </p>
                <p className="text-red-100 text-xs">
                  Los datos mostrados son ejemplos ilustrativos. Active su academia para acceder a funcionalidad completa.
                </p>
              </div>
            </div>
            <button
              onClick={handleActivateClick}
              className="flex-shrink-0 px-5 py-2 bg-white text-red-700 font-semibold rounded-md hover:bg-red-50 transition-colors shadow-sm text-sm whitespace-nowrap"
            >
              Activar Academia
            </button>
          </div>
        </div>
      </div>

      {/* Professional Email Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Verificación Importante</h3>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 font-medium mb-3">
                  Utiliza el email viculado a tu cuenta de AKADEMO durante el pago:
                </p>
                <div className="bg-white border-2 border-red-300 rounded-lg px-4 py-3 flex items-center gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-base font-semibold text-gray-900 break-all">{userEmail}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-center border-t border-gray-200">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg"
              >
                Continuar al Pago
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
