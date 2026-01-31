'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

export function DemoDataBanner() {
  const [academyId, setAcademyId] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleConfirm = async () => {
    setShowModal(false);
    
    try {
      // Call API to create Stripe session with email prefill
      const response = await apiClient('/payments/academy-activation-session', {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (result.success && result.data?.url) {
        // Open Stripe in new tab
        window.open(result.data.url, '_blank');
        
        // Set up auto-refresh when user returns to this tab after payment
        const handleVisibilityChange = () => {
          if (!document.hidden) {
            // User returned to AKADEMO tab - refresh to check if payment completed
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        };
        
        // Add listener for when user switches back to this tab
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Clean up listener after 5 minutes (payment should be done by then)
        setTimeout(() => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        }, 5 * 60 * 1000);
      } else {
        alert('Error al crear sesión de pago. Por favor intenta de nuevo.');
      }
    } catch (error) {
      console.error('Error creating activation session:', error);
      alert('Error al procesar el pago. Por favor intenta de nuevo.');
    }
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(userEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy email:', err);
    }
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
                <div className="bg-white border-2 border-red-300 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-base font-semibold text-gray-900 break-all">{userEmail}</span>
                  </div>
                  <button
                    onClick={handleCopyEmail}
                    className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors relative group"
                    title="Copiar email"
                  >
                    {copied ? (
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
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
