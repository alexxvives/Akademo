'use client';

import { useState } from 'react';
import { apiPost } from '@/lib/api-client';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className: string;
  academyName: string;
  price: number;
  currency: string;
  currentPaymentStatus?: string;
  currentPaymentMethod?: string;
  onPaymentComplete: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  classId,
  className,
  academyName,
  price,
  currency,
  currentPaymentStatus,
  currentPaymentMethod,
  onPaymentComplete,
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'stripe' | 'bizum' | null>(null);
  const [processing, setProcessing] = useState(false);
  const [confirmingCash, setConfirmingCash] = useState(false);
  const [confirmingBizum, setConfirmingBizum] = useState(false);

  // Debug logging
  console.log('[PaymentModal] Props:', {
    currentPaymentStatus,
    currentPaymentMethod,
    classId,
    className
  });

  // Debug conditional checks
  console.log('[PaymentModal] CASH Check:', {
    isCashPending: currentPaymentStatus === 'CASH_PENDING',
    isCashMethod: currentPaymentMethod === 'cash',
    shouldShowGreen: currentPaymentStatus === 'CASH_PENDING' && currentPaymentMethod === 'cash'
  });

  console.log('[PaymentModal] BIZUM Check:', {
    isBizumPending: currentPaymentStatus === 'BIZUM_PENDING',
    isBizumMethod: currentPaymentMethod === 'bizum',
    shouldShowGreen: currentPaymentStatus === 'BIZUM_PENDING' && currentPaymentMethod === 'bizum'
  });

  if (!isOpen) return null;

  const handleCashPayment = () => {
    setConfirmingCash(true);
  };

  const handleConfirmCash = async () => {
    setProcessing(true);
    try {
      // Debug: Check token
      const token = localStorage.getItem('auth_token');
      console.log('[PaymentModal] Token exists:', !!token);
      console.log('[PaymentModal] Token length:', token?.length);
      
      const res = await apiPost('/payments/initiate', { 
        classId, 
        paymentMethod: 'cash' 
      });

      console.log('[PaymentModal] Response status:', res.status);
      const result = await res.json();
      console.log('[PaymentModal] Response result:', result);
      
      if (result.success) {
        onPaymentComplete();
      } else {
        throw new Error(result.error || 'Error al registrar pago');
      }
    } catch (error: any) {
      console.error('[PaymentModal] Cash payment error:', error);
      alert('Error: ' + error.message);
    } finally {
      setProcessing(false);
      setConfirmingCash(false);
    }
  };

  const handleStripePayment = async () => {
    setProcessing(true);
    try {
      console.log('[PaymentModal] Initiating Stripe payment for classId:', classId);
      
      const res = await apiPost('/payments/stripe-session', { 
        classId
      });

      console.log('[PaymentModal] Stripe response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('[PaymentModal] Stripe error response:', errorText);
        throw new Error(`HTTP error! status: ${res.status} - ${errorText}`);
      }

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('La respuesta del servidor no es JSON. Por favor, verifica que el API worker esté desplegado.');
      }

      const result = await res.json();
      console.log('[PaymentModal] Stripe result:', result);
      if (result.success && result.data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = result.data.url;
      } else {
        throw new Error(result.error || 'Error al crear sesión de pago');
      }
    } catch (error: any) {
      console.error('Stripe payment error:', error);
      alert('Error: ' + error.message);
      setProcessing(false);
    }
  };

  const handleBizumPayment = () => {
    setConfirmingBizum(true);
  };

  const handleConfirmBizum = async () => {
    setProcessing(true);
    try {
      // Bizum works like cash - requires academy confirmation
      const res = await apiPost('/payments/initiate', {
        classId,
        paymentMethod: 'bizum',
      });

      const result = await res.json();
      
      if (result.success) {
        onPaymentComplete();
      } else {
        throw new Error(result.error || 'Error al registrar pago por Bizum');
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setProcessing(false);
      setConfirmingBizum(false);
    }
  };

  const formatPrice = (amount: number, curr: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: curr || 'EUR',
    }).format(amount);
  };

  // Cash confirmation dialog
  if (confirmingCash) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl">
          <div className="p-8 border-b border-gray-200">
            <h3 className="text-2xl font-semibold text-gray-900">Confirmar Pago en Efectivo</h3>
          </div>
          
          <div className="p-8">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <p className="text-gray-700 leading-relaxed text-center">
                Tu solicitud quedará pendiente hasta que la academia confirme haber recibido el pago. No tendrás acceso a la clase hasta la aprobación.
              </p>
            </div>
          </div>

          <div className="p-8 border-t border-gray-200 flex gap-4">
            <button
              onClick={() => setConfirmingCash(false)}
              disabled={processing}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmCash}
              disabled={processing}
              className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-lg text-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Procesando...' : 'Confirmar Pago'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Bizum confirmation dialog
  if (confirmingBizum) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl">
          <div className="p-8 border-b border-gray-200">
            <h3 className="text-2xl font-semibold text-gray-900">Confirmar Pago por Bizum</h3>
          </div>
          
          <div className="p-8">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <p className="text-gray-700 leading-relaxed text-center">
                Tu solicitud quedará pendiente hasta que la academia confirme haber recibido el pago. No tendrás acceso a la clase hasta la aprobación.
              </p>
            </div>
          </div>

          <div className="p-8 border-t border-gray-200 flex gap-4">
            <button
              onClick={() => setConfirmingBizum(false)}
              disabled={processing}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg text-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmBizum}
              disabled={processing}
              className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-lg text-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Procesando...' : 'Confirmar Pago'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4" style={{ margin: 0 }}>
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-8 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Seleccionar Método de Pago</h2>
              <p className="text-gray-600 mt-2">
                {className} <span className="text-gray-400">•</span> {academyName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Container with Two Columns */}
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Side - Price Info */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 h-full flex flex-col justify-center">
                <p className="text-xs uppercase tracking-wider text-gray-500 mb-2 text-center">Total</p>
                <p className="text-3xl font-bold text-gray-900 text-center">{formatPrice(price, currency)}</p>
                <p className="text-xs text-gray-500 mt-1 text-center">/ mes</p>
              </div>
            </div>

            {/* Right Side - Payment Options */}
            <div className="lg:col-span-3 space-y-3">
              {/* Stripe Payment (Card) - FIRST */}
              <button
                onClick={() => {
                  setSelectedMethod('stripe');
                  handleStripePayment();
                }}
                className="w-full p-4 border-2 border-gray-300 rounded-xl text-left transition-all hover:border-gray-400 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Tarjeta de Crédito/Débito</h3>
                    <p className="text-gray-600 mb-3">
                      Pago seguro con Stripe (Visa, Mastercard, etc.)
                    </p>
                    <span className="inline-block text-xs text-white bg-gray-900 px-3 py-1.5 rounded-full">
                      Acceso inmediato
                    </span>
                  </div>
                </div>
              </button>

              {/* Bizum - SECOND */}
              <button
                onClick={() => {
                  setSelectedMethod('bizum');
                  handleBizumPayment();
                }}
                className="w-full p-4 border-2 border-gray-300 rounded-xl text-left transition-all hover:border-gray-400 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Bizum</h3>
                    <p className="text-gray-600 mb-3">
                      Pago instantáneo con tu banco español
                    </p>
                    {currentPaymentStatus === 'BIZUM_PENDING' && currentPaymentMethod === 'bizum' ? (
                      <span className="inline-block text-xs px-3 py-1.5 rounded-full font-medium" style={{ backgroundColor: '#b1e787', color: '#1a1c29' }}>
                        Esperando aprobación de la academia
                      </span>
                    ) : (
                      <span className="inline-block text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                        Requiere aprobación del profesor
                      </span>
                    )}
                  </div>
                </div>
              </button>

              {/* Cash Payment - THIRD */}
              <button
                onClick={() => {
                  setSelectedMethod('cash');
                  handleCashPayment();
                }}
                className="w-full p-4 border-2 border-gray-300 rounded-xl text-left transition-all hover:border-gray-400 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Efectivo</h3>
                    <p className="text-gray-600 mb-3">
                      Paga directamente a la academia en persona
                    </p>
                    {currentPaymentStatus === 'CASH_PENDING' && currentPaymentMethod === 'cash' ? (
                      <span className="inline-block text-xs px-3 py-1.5 rounded-full font-medium" style={{ backgroundColor: '#b1e787', color: '#1a1c29' }}>
                        Esperando aprobación de la academia
                      </span>
                    ) : (
                      <span className="inline-block text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                        Requiere aprobación del profesor
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
