'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';

interface PendingPayment {
  enrollmentId: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentAmount: number;
  currency: string;
  createdAt: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string;
  studentEmail: string;
  classId: string;
  className: string;
  academyId: string;
  academyName: string;
}

export default function AcademyPaymentsPage() {
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadPendingPayments();
  }, []);

  const loadPendingPayments = async () => {
    try {
      const res = await apiClient('/payments/pending-cash');
      const result = await res.json();

      if (result.success) {
        setPendingPayments(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load pending payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (enrollmentId: string, studentName: string) => {
    if (!confirm(`¿Aprobar pago en efectivo de ${studentName}?`)) return;

    setProcessing(enrollmentId);
    try {
      const res = await apiClient(`/payments/${enrollmentId}/approve-cash`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      });

      const result = await res.json();
      if (result.success) {
        alert('Pago aprobado correctamente');
        setPendingPayments(prev => prev.filter(p => p.enrollmentId !== enrollmentId));
      } else {
        throw new Error(result.error || 'Error al aprobar pago');
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (enrollmentId: string, studentName: string) => {
    if (!confirm(`¿Rechazar pago en efectivo de ${studentName}?\n\nEsto requerirá que el estudiante vuelva a iniciar el pago.`)) return;

    setProcessing(enrollmentId);
    try {
      const res = await apiClient(`/payments/${enrollmentId}/approve-cash`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: false }),
      });

      const result = await res.json();
      if (result.success) {
        alert('Pago rechazado');
        setPendingPayments(prev => prev.filter(p => p.enrollmentId !== enrollmentId));
      } else {
        throw new Error(result.error || 'Error al rechazar pago');
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount);
  };

  const totalPending = pendingPayments.reduce((sum, p) => sum + p.paymentAmount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pagos Pendientes</h1>
        <p className="text-sm text-gray-500 mt-1">Aprueba o rechaza los pagos en efectivo de los estudiantes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border-2 border-yellow-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pagos Pendientes</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {pendingPayments.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-green-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pendiente</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {formatCurrency(totalPending, 'EUR')}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Payments List */}
      {pendingPayments.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No hay pagos pendientes</h3>
          <p className="text-gray-500">Los pagos en efectivo aparecerán aquí cuando los estudiantes los registren</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingPayments.map((payment) => (
            <div
              key={payment.enrollmentId}
              className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-yellow-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold">
                      {payment.studentFirstName[0]}{payment.studentLastName[0]}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {payment.studentFirstName} {payment.studentLastName}
                      </h3>
                      <p className="text-sm text-gray-500">{payment.studentEmail}</p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span className="font-medium">{payment.className}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Registrado el {new Date(payment.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {formatCurrency(payment.paymentAmount, payment.currency)} en efectivo
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => handleApprove(payment.enrollmentId, `${payment.studentFirstName} ${payment.studentLastName}`)}
                    disabled={processing === payment.enrollmentId}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {processing === payment.enrollmentId ? 'Procesando...' : 'Aprobar'}
                  </button>
                  <button
                    onClick={() => handleReject(payment.enrollmentId, `${payment.studentFirstName} ${payment.studentLastName}`)}
                    disabled={processing === payment.enrollmentId}
                    className="px-4 py-2 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Rechazar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
