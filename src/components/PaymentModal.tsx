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
        <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{className}</h2>
              <p className="text-gray-600 mt-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            {/* Payment Frequency Selection - Only if both options exist */}
            {needsFrequencySelection && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Selecciona tu modalidad de pago</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Monthly Card */}
                  <button
                    onClick={() => setPaymentFrequency('monthly')}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                      paymentFrequency === 'monthly'
                        ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-2xl font-bold ${paymentFrequency === 'monthly' ? 'text-blue-600' : 'text-gray-700'}`}>
                        {formatPrice(monthlyPrice || 0, currency)}
                      </span>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        paymentFrequency === 'monthly' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                        {paymentFrequency === 'monthly' && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">Pago Mensual</h4>
                    <p className="text-sm text-gray-600">Cobro recurrente cada mes • Mayor flexibilidad</p>
                  </button>

                  {/* One-Time Card */}
                  <button
                    onClick={() => setPaymentFrequency('one-time')}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                      paymentFrequency === 'one-time'
                        ? 'border-green-500 bg-green-50 shadow-lg ring-2 ring-green-200'
                        : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-2xl font-bold ${paymentFrequency === 'one-time' ? 'text-green-600' : 'text-gray-700'}`}>
                        {formatPrice(oneTimePrice || 0, currency)}
                      </span>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        paymentFrequency === 'one-time' ? 'border-green-500 bg-green-500' : 'border-gray-300'
                      }`}>
                        {paymentFrequency === 'one-time' && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">Pago Único</h4>
                    <p className="text-sm text-gray-600">Un solo pago • Acceso total inmediato</p>
                  </button>
                </div>
              </div>
            )}

            {/* Payment Methods */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {needsFrequencySelection && !paymentFrequency 
                  ? 'Selecciona una modalidad primero'
                  : 'Selecciona tu método de pago'
                }
              </h3>
              
              <div className="space-y-3">
                {/* Stripe Payment */}
                <button
                  onClick={handleStripePayment}
                  disabled={processing || (needsFrequencySelection && !paymentFrequency)}
                  className={`w-full p-5 rounded-xl text-left transition-all ${
                    needsFrequencySelection && !paymentFrequency
                      ? 'bg-gray-50 border-2 border-gray-200 opacity-50 cursor-not-allowed'
                      : 'bg-white border-2 border-gray-300 hover:border-blue-400 hover:shadow-lg hover:scale-[1.02]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">Tarjeta de Crédito/Débito</h4>
                      <p className="text-sm text-gray-600">Pago seguro con Stripe • Acceso inmediato</p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-block text-xs font-medium text-white bg-green-600 px-3 py-1.5 rounded-full">
                        ⚡ Instantáneo
                      </span>
                    </div>
                  </div>
                </button>

                {/* Bizum */}
                <button
                  onClick={handleBizumPayment}
                  disabled={processing || (needsFrequencySelection && !paymentFrequency)}
                  className={`w-full p-5 rounded-xl text-left transition-all ${
                    needsFrequencySelection && !paymentFrequency
                      ? 'bg-gray-50 border-2 border-gray-200 opacity-50 cursor-not-allowed'
                      : 'bg-white border-2 border-gray-300 hover:border-purple-400 hover:shadow-lg hover:scale-[1.02]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">Bizum</h4>
                      <p className="text-sm text-gray-600">Pago con tu banco español</p>
                    </div>
                    <div className="flex-shrink-0">
                      {currentPaymentStatus === 'BIZUM_PENDING' && currentPaymentMethod === 'bizum' ? (
                        <span className="inline-block text-xs font-medium px-3 py-1.5 rounded-full" style={{ backgroundColor: '#b1e787', color: '#1a1c29' }}>
                          Pendiente aprobación
                        </span>
                      ) : (
                        <span className="inline-block text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                          Requiere aprobación
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Cash Payment */}
                <button
                  onClick={handleCashPayment}
                  disabled={processing || (needsFrequencySelection && !paymentFrequency)}
                  className={`w-full p-5 rounded-xl text-left transition-all ${
                    needsFrequencySelection && !paymentFrequency
                      ? 'bg-gray-50 border-2 border-gray-200 opacity-50 cursor-not-allowed'
                      : 'bg-white border-2 border-gray-300 hover:border-amber-400 hover:shadow-lg hover:scale-[1.02]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">Efectivo</h4>
                      <p className="text-sm text-gray-600">Paga directamente en la academia</p>
                    </div>
                    <div className="flex-shrink-0">
                      {currentPaymentStatus === 'CASH_PENDING' && currentPaymentMethod === 'cash' ? (
                        <span className="inline-block text-xs font-medium px-3 py-1.5 rounded-full" style={{ backgroundColor: '#b1e787', color: '#1a1c29' }}>
                          Pendiente aprobación
                        </span>
                      ) : (
                        <span className="inline-block text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                          Requiere aprobación
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Security Badge */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <p className="text-3xl font-bold text-gray-900 text-center">{formatPrice(currentPrice, currency)}</p>
                <p className="text-xs text-gray-500 mt-1 text-center">{priceLabel}</p>
              </div>
            </div>

            {/* Right Side - Frequency Selection or Payment Options */}
            <div className="lg:col-span-3 space-y-3">
              {isClassFull ? (
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
              ) : needsFrequencySelection && !paymentFrequency ? (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Selecciona el tipo de pago</h3>
                  
                  {/* Monthly Option */}
                  <button
                    onClick={() => setPaymentFrequency('monthly')}
                    className="w-full p-6 border-2 border-blue-200 bg-blue-50 rounded-xl text-left transition-all hover:border-blue-400 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-900 mb-2">Pago Mensual</h4>
                        <p className="text-gray-600 mb-3">
                          {formatPrice(monthlyPrice || 0, currency)} por mes
                        </p>
                        <p className="text-sm text-gray-500">
                          Cobro recurrente mensual
                        </p>
                      </div>
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>

                  {/* One-Time Option */}
                  <button
                    onClick={() => setPaymentFrequency('one-time')}
                    className="w-full p-6 border-2 border-green-200 bg-green-50 rounded-xl text-left transition-all hover:border-green-400 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-900 mb-2">Pago Único</h4>
                        <p className="text-gray-600 mb-3">
                          {formatPrice(oneTimePrice || 0, currency)} una sola vez
                        </p>
                        <p className="text-sm text-gray-500">
                          Pago único, acceso total
                        </p>
                      </div>
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                </>
              ) : showPaymentMethods ? (
                <>
                  {needsFrequencySelection && (
                    <button
                      onClick={() => setPaymentFrequency(null)}
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Volver a seleccionar tipo de pago
                    </button>
                  )}
                  
                  {/* Stripe Payment */}
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

              {/* Bizum */}
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
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
