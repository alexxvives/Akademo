'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import DashboardLayout from '@/components/DashboardLayout';

interface ClassInfo {
  id: string;
  name: string;
  academyName: string;
  price: number;
  currency: string;
  paymentStatus: string;
}

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const classId = searchParams.get('classId');
  
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'bank_transfer' | 'bizum' | null>(null);

  useEffect(() => {
    if (!classId) {
      router.push('/dashboard/student/classes');
      return;
    }
    loadClassInfo();
  }, [classId]);

  const loadClassInfo = async () => {
    try {
      const res = await apiClient(`/classes/${classId}`);
      const result = await res.json();
      
      if (result.success) {
        setClassInfo(result.data);
      } else {
        alert('No se pudo cargar la información de la clase');
        router.push('/dashboard/student/classes');
      }
    } catch (error) {
      console.error('Error loading class:', error);
      alert('Error al cargar la clase');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod || !classId) return;

    setProcessing(true);
    try {
      if (selectedMethod === 'cash') {
        const res = await apiClient('/payments/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            classId,
            method: 'cash',
          }),
        });

        const result = await res.json();
        if (result.success) {
          alert('Solicitud de pago en efectivo enviada. El profesor la revisará pronto.');
          router.push('/dashboard/student/classes');
        } else {
          alert(result.error || 'Error al procesar el pago');
        }
      } else {
        // For bank_transfer and bizum (Stripe Connect)
        const res = await apiClient('/payments/stripe-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            classId,
            method: selectedMethod,
          }),
        });

        const result = await res.json();
        if (result.success && result.data?.url) {
          window.location.href = result.data.url;
        } else {
          alert(result.error || 'Stripe Connect no está configurado todavía. Por favor, usa efectivo.');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Error al procesar el pago');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="STUDENT">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!classInfo) {
    return (
      <DashboardLayout role="STUDENT">
        <div className="text-center py-12">
          <p className="text-gray-600">Clase no encontrada</p>
        </div>
      </DashboardLayout>
    );
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  return (
    <DashboardLayout role="STUDENT">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">Realizar Pago</h1>
          <div className="mt-2 text-gray-600">
            <p className="text-lg">{classInfo.name}</p>
            <p className="text-sm">{classInfo.academyName}</p>
          </div>
        </div>

        {/* Price Card */}
        <div className="bg-gradient-to-r from-brand-50 to-brand-100 border-2 border-brand-200 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brand-700 font-medium mb-1">Total a pagar</p>
              <p className="text-4xl font-bold text-brand-900">{formatPrice(classInfo.price, classInfo.currency)}</p>
            </div>
            <svg className="w-16 h-16 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Selecciona método de pago</h2>
          
          <div className="grid gap-4">
            {/* Cash */}
            <button
              onClick={() => setSelectedMethod('cash')}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                selectedMethod === 'cash'
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  selectedMethod === 'cash' ? 'bg-brand-100' : 'bg-gray-100'
                }`}>
                  <svg className={`w-6 h-6 ${selectedMethod === 'cash' ? 'text-brand-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Efectivo</h3>
                  <p className="text-sm text-gray-600">Paga en efectivo directamente a tu academia</p>
                </div>
                {selectedMethod === 'cash' && (
                  <svg className="w-6 h-6 text-brand-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>

            {/* Bank Transfer (Stripe Connect) */}
            <button
              onClick={() => setSelectedMethod('bank_transfer')}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                selectedMethod === 'bank_transfer'
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  selectedMethod === 'bank_transfer' ? 'bg-brand-100' : 'bg-gray-100'
                }`}>
                  <svg className={`w-6 h-6 ${selectedMethod === 'bank_transfer' ? 'text-brand-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Transferencia Bancaria</h3>
                  <p className="text-sm text-gray-600">Pago seguro mediante Stripe Connect</p>
                </div>
                {selectedMethod === 'bank_transfer' && (
                  <svg className="w-6 h-6 text-brand-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>

            {/* Bizum (Stripe Connect) */}
            <button
              onClick={() => setSelectedMethod('bizum')}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                selectedMethod === 'bizum'
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  selectedMethod === 'bizum' ? 'bg-brand-100' : 'bg-gray-100'
                }`}>
                  <svg className={`w-6 h-6 ${selectedMethod === 'bizum' ? 'text-brand-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Bizum</h3>
                  <p className="text-sm text-gray-600">Pago instantáneo con tu móvil</p>
                </div>
                {selectedMethod === 'bizum' && (
                  <svg className="w-6 h-6 text-brand-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handlePayment}
          disabled={!selectedMethod || processing}
          className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
            selectedMethod && !processing
              ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {processing ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Procesando...
            </div>
          ) : (
            `Pagar ${formatPrice(classInfo.price, classInfo.currency)}`
          )}
        </button>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Información importante</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Los pagos en efectivo requieren aprobación del profesor</li>
                <li>Los pagos con tarjeta son procesados de forma segura por Stripe</li>
                <li>Una vez pagado, tendrás acceso inmediato al contenido de la clase</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
