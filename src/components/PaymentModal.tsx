'use client';

import { useState } from 'react';
import { apiPost } from '@/lib/api-client';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className: string;
  academyName: string;
  currentPaymentStatus?: string;
  currentPaymentMethod?: string;
  onPaymentComplete: () => void;
  monthlyPrice?: number | null;
  oneTimePrice?: number | null;
  maxStudents?: number;
  currentStudentCount?: number;
}

export default function PaymentModal({
  isOpen,
  onClose,
  classId,
  className,
  academyName,
  currentPaymentStatus,
  currentPaymentMethod,
  onPaymentComplete,
  monthlyPrice,
  oneTimePrice,
  maxStudents,
  currentStudentCount,
}: PaymentModalProps) {
  const [paymentFrequency, setPaymentFrequency] = useState<'monthly' | 'one-time' | null>(null);
  const [processing, setProcessing] = useState(false);
  const [confirmingCash, setConfirmingCash] = useState(false);
  const [confirmingBizum, setConfirmingBizum] = useState(false);

  if (!isOpen) return null;

  // Check if class is full
  const isClassFull = maxStudents && currentStudentCount && currentStudentCount >= maxStudents;

  // Determine payment options based on which prices are set
  const hasMonthly = monthlyPrice != null && monthlyPrice > 0;
  const hasOneTime = oneTimePrice != null && oneTimePrice > 0;
  const needsFrequencySelection = hasMonthly && hasOneTime;

  const currency = 'EUR';

  const formatPrice = (amount: number, curr: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: curr || 'EUR',
    }).format(amount);
  };

  const handleCashPayment = () => {
    setConfirmingCash(true);
  };

  const handleConfirmCash = async () => {
    setProcessing(true);
    try {
      const res = await apiPost('/payments/initiate', { 
        classId, 
        paymentMethod: 'cash' 
      });

      const result = await res.json();
      
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
    if (!paymentFrequency && needsFrequencySelection) {
      alert('Por favor selecciona un tipo de pago primero');
      return;
    }
    
    setProcessing(true);
    try {
      const res = await apiPost('/payments/stripe-session', { 
        classId,
        paymentFrequency: paymentFrequency || (hasMonthly ? 'monthly' : 'one-time')
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP error! status: ${res.status} - ${errorText}`);
      }

      const result = await res.json();
      if (result.success && result.data?.url) {
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
    if (!paymentFrequency && needsFrequencySelection) {
      alert('Por favor selecciona un tipo de pago primero');
      return;
    }
    setConfirmingBizum(true);
  };

  const handleConfirmBizum = async () => {
    setProcessing(true);
    try {
      const res = await apiPost('/payments/initiate', {
        classId,
        paymentMethod: 'bizum',
        paymentFrequency: paymentFrequency || (hasMonthly ? 'monthly' : 'one-time')
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#b0e788]/10 to-[#b0e788]/5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#1a1c29]">{className}</h2>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {academyName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {isClassFull ? (
          <div className="p-8">
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
              <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Clase completa</h3>
              <p className="text-gray-600 mb-4">
                Esta clase ha alcanzado su límite máximo de {maxStudents} estudiantes.
              </p>
              <p className="text-sm text-gray-500">
                Puedes contactar a la academia para solicitar más cupos.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-8">
            {/* Payment Frequency Selection - Always show both options */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Selecciona tu modalidad de pago</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Monthly Card */}
                <button
                  onClick={() => hasMonthly && setPaymentFrequency('monthly')}
                  disabled={!hasMonthly}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    !hasMonthly
                      ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                      : paymentFrequency === 'monthly'
                      ? 'border-[#b0e788] bg-[#b0e788]/10 shadow-md'
                      : 'border-gray-200 bg-white hover:border-[#b0e788]/50 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`text-base font-semibold mb-1 ${!hasMonthly ? 'text-gray-400' : 'text-[#1a1c29]'}`}>
                        Pago Mensual
                      </h4>
                      <span className={`text-xl font-bold ${!hasMonthly ? 'text-gray-400' : paymentFrequency === 'monthly' ? 'text-[#1a1c29]' : 'text-gray-700'}`}>
                        {hasMonthly ? formatPrice(monthlyPrice || 0, currency) : 'No disponible'}
                      </span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      !hasMonthly
                        ? 'border-gray-300 bg-gray-200'
                        : paymentFrequency === 'monthly' 
                        ? 'border-[#b0e788] bg-[#b0e788]' 
                        : 'border-gray-300'
                    }`}>
                      {paymentFrequency === 'monthly' && hasMonthly && (
                        <svg className="w-3 h-3 text-[#1a1c29]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>

                {/* One-Time Card */}
                <button
                  onClick={() => hasOneTime && setPaymentFrequency('one-time')}
                  disabled={!hasOneTime}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    !hasOneTime
                      ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                      : paymentFrequency === 'one-time'
                      ? 'border-[#b0e788] bg-[#b0e788]/10 shadow-md'
                      : 'border-gray-200 bg-white hover:border-[#b0e788]/50 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`text-base font-semibold mb-1 ${!hasOneTime ? 'text-gray-400' : 'text-[#1a1c29]'}`}>
                        Pago Único
                      </h4>
                      <span className={`text-xl font-bold ${!hasOneTime ? 'text-gray-400' : paymentFrequency === 'one-time' ? 'text-[#1a1c29]' : 'text-gray-700'}`}>
                        {hasOneTime ? formatPrice(oneTimePrice || 0, currency) : 'No disponible'}
                      </span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      !hasOneTime
                        ? 'border-gray-300 bg-gray-200'
                        : paymentFrequency === 'one-time' 
                        ? 'border-[#b0e788] bg-[#b0e788]' 
                        : 'border-gray-300'
                    }`}>
                      {paymentFrequency === 'one-time' && hasOneTime && (
                        <svg className="w-3 h-3 text-[#1a1c29]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Payment Methods */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {!paymentFrequency 
                  ? 'Selecciona una modalidad primero'
                  : 'Selecciona tu método de pago'
                }
              </h3>
              
              <div className="space-y-3">
                {/* Stripe Payment */}
                <button
                  onClick={handleStripePayment}
                  disabled={processing || !paymentFrequency}
                  className={`w-full p-4 rounded-lg text-left transition-all ${
                    !paymentFrequency
                      ? 'bg-gray-50 border-2 border-gray-200 opacity-50 cursor-not-allowed'
                      : 'bg-white border-2 border-gray-300 hover:border-[#b0e788] hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-[#b0e788]/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#1a1c29]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-[#1a1c29] mb-0.5">Tarjeta de Crédito/Débito</h4>
                      <p className="text-sm text-gray-600">Pago seguro con Stripe</p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-block text-xs font-medium text-white bg-[#b0e788] px-3 py-1 rounded-full">
                        Instantáneo
                      </span>
                    </div>
                  </div>
                </button>

                {/* Bizum */}
                <button
                  onClick={handleBizumPayment}
                  disabled={processing || !paymentFrequency}
                  className={`w-full p-4 rounded-lg text-left transition-all ${
                    !paymentFrequency
                      ? 'bg-gray-50 border-2 border-gray-200 opacity-50 cursor-not-allowed'
                      : 'bg-white border-2 border-gray-300 hover:border-[#b0e788] hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-[#b0e788]/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#1a1c29]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-[#1a1c29] mb-0.5">Bizum</h4>
                      <p className="text-sm text-gray-600">Pago con tu banco español</p>
                    </div>
                    <div className="flex-shrink-0">
                      {currentPaymentStatus === 'BIZUM_PENDING' && currentPaymentMethod === 'bizum' ? (
                        <span className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-[#b0e788] text-[#1a1c29]">
                          Pendiente aprobación
                        </span>
                      ) : (
                        <span className="inline-block text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                          Requiere aprobación
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Cash Payment */}
                <button
                  onClick={handleCashPayment}
                  disabled={processing || !paymentFrequency}
                  className={`w-full p-4 rounded-lg text-left transition-all ${
                    !paymentFrequency
                      ? 'bg-gray-50 border-2 border-gray-200 opacity-50 cursor-not-allowed'
                      : 'bg-white border-2 border-gray-300 hover:border-[#b0e788] hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-[#b0e788]/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#1a1c29]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-[#1a1c29] mb-0.5">Efectivo</h4>
                      <p className="text-sm text-gray-600">Paga directamente en la academia</p>
                    </div>
                    <div className="flex-shrink-0">
                      {currentPaymentStatus === 'CASH_PENDING' && currentPaymentMethod === 'cash' ? (
                        <span className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-[#b0e788] text-[#1a1c29]">
                          Pendiente aprobación
                        </span>
                      ) : (
                        <span className="inline-block text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                          Requiere aprobación
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Security Badge */}
            <div className="mt-6 pt-5 border-t border-gray-200">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <svg className="w-5 h-5 text-[#b0e788]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Pagos 100% seguros y encriptados</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
