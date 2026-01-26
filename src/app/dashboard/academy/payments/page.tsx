'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { generateDemoPendingPayments, generateDemoPaymentHistory } from '@/lib/demo-data';

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
  teacherName?: string;
}

interface PaymentHistory {
  enrollmentId: string;
  studentFirstName: string;
  studentLastName: string;
  studentEmail: string;
  className: string;
  paymentAmount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  approvedByName?: string;
  updatedAt: string;
  teacherName?: string;
}

export default function AcademyPaymentsPage() {
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [reversingIds, setReversingIds] = useState<Set<string>>(new Set());
  const [paymentStatus, setPaymentStatus] = useState<string>('PAID');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Check academy payment status first
      const academyRes = await apiClient('/academies');
      const academyResult = await academyRes.json();
      
      if (academyResult.success && Array.isArray(academyResult.data) && academyResult.data.length > 0) {
        const academy = academyResult.data[0];
        const status = academy.paymentStatus || 'PAID';
        setPaymentStatus(status);
        
        // If NOT PAID, show demo payments
        if (status === 'NOT PAID') {
          const demoPending = generateDemoPendingPayments();
          const demoHistory = generateDemoPaymentHistory();
          setPendingPayments(demoPending as any[]);
          setPaymentHistory(demoHistory as any[]);
          setClasses([
            { id: 'demo-c1', name: 'Programación Web Moderna' },
            { id: 'demo-c2', name: 'Matemáticas Avanzadas' },
            { id: 'demo-c3', name: 'Diseño Gráfico Profesional' },
          ]);
          setLoading(false);
          return;
        }
      }
      
      // If PAID, load real payments
      const [pendingRes, historyRes, classesRes] = await Promise.all([
        apiClient('/payments/pending-cash'),
        apiClient('/payments/history'),
        apiClient('/academies/classes'),
      ]);

      const [pendingResult, historyResult, classesResult] = await Promise.all([
        pendingRes.json(),
        historyRes.json(),
        classesRes.json(),
      ]);

      if (pendingResult.success) {
        setPendingPayments(pendingResult.data || []);
      }

      if (historyResult.success) {
        setPaymentHistory(historyResult.data || []);
      }
      
      if (classesResult.success && Array.isArray(classesResult.data)) {
        setClasses(classesResult.data);
      }
    } catch (error) {
      console.error('Failed to load payments data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (enrollmentId: string) => {
    setProcessingIds(prev => new Set(prev).add(enrollmentId));
    try {
      const res = await apiClient(`/payments/${enrollmentId}/approve-cash`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      });

      const result = await res.json();
      if (result.success) {
        setPendingPayments(prev => prev.filter(p => p.enrollmentId !== enrollmentId));
        loadData(); // Reload to update history
      } else {
        alert(result.error || 'Error al confirmar pago');
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(enrollmentId);
        return next;
      });
    }
  };

  const handleReject = async (enrollmentId: string) => {
    setProcessingIds(prev => new Set(prev).add(enrollmentId));
    try {
      const res = await apiClient(`/payments/${enrollmentId}/approve-cash`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: false }),
      });

      const result = await res.json();
      if (result.success) {
        setPendingPayments(prev => prev.filter(p => p.enrollmentId !== enrollmentId));
        loadData(); // Reload to update history
      } else {
        alert(result.error || 'Error al denegar pago');
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(enrollmentId);
        return next;
      });
    }
  };

  const handleReversePayment = async (enrollmentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'PAID' ? 'denegado' : 'confirmado';
    if (!confirm(`�Est�s seguro de revertir este estado a ${newStatus}?`)) {
      return;
    }

    setReversingIds(prev => new Set(prev).add(enrollmentId));
    try {
      const response = await apiClient(`/payments/history/${enrollmentId}/reverse`, {
        method: 'PUT',
      });

      const result = await response.json();
      if (result.success) {
        loadData(); // Reload to update history
      } else {
        alert(result.error || 'Failed to reverse payment status');
      }
    } catch (error) {
      console.error('Error reversing payment status:', error);
      alert('An error occurred');
    } finally {
      setReversingIds(prev => {
        const next = new Set(prev);
        next.delete(enrollmentId);
        return next;
      });
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount);
  };
  
  const filteredPaymentHistory = paymentHistory.filter(p => 
    selectedClass === 'all' || p.className === classes.find(c => c.id === selectedClass)?.name
  );

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando pagos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Pagos Pendientes</h1>
          <p className="text-gray-600 text-sm mt-1">
            Revisa y confirma los pagos en efectivo de los estudiantes
          </p>
        </div>
        {/* Class Filter */}
        {classes.length > 0 && (
          <div className="relative">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="appearance-none w-56 pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="all">Todas las clases</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Pending Payments List */}
      {pendingPayments.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay pagos pendientes</h3>
          <p className="text-gray-500">Los pagos en efectivo aparecerán aquí cuando los estudiantes los registren</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingPayments.map((payment) => (
            <div key={payment.enrollmentId} className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-all">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-accent-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="w-56">
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {payment.studentFirstName} {payment.studentLastName}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">{payment.studentEmail}</p>
                    </div>
                    <div className="border-l border-gray-200 pl-8">
                      <div className="flex items-center gap-2 text-sm mb-0.5">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span className="text-gray-900 font-medium">{payment.className}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Registrado {new Date(payment.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                    </div>
                    <div className="border-l border-gray-200 pl-8">
                      <div className="flex items-center gap-2 text-sm mb-0.5">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="font-semibold">{formatCurrency(payment.paymentAmount, payment.currency)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span className="capitalize">{payment.paymentMethod === 'CASH' ? 'Efectivo' : payment.paymentMethod}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => handleReject(payment.enrollmentId)}
                    disabled={processingIds.has(payment.enrollmentId)}
                    className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingIds.has(payment.enrollmentId) ? 'Procesando...' : 'Denegar'}
                  </button>
                  <button
                    onClick={() => handleApprove(payment.enrollmentId)}
                    disabled={processingIds.has(payment.enrollmentId)}
                    className="px-5 py-2.5 bg-accent-300 text-gray-900 border-2 border-accent-300 rounded-lg hover:bg-accent-400 hover:border-accent-400 font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingIds.has(payment.enrollmentId) ? 'Procesando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment History Table */}
      {paymentHistory.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Historial de Pagos</h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estudiante</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clase</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profesor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">METODO</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aprobado por</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACCION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPaymentHistory.map((history, index) => (
                  <tr key={`${history.enrollmentId}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {history.studentFirstName} {history.studentLastName}
                        </div>
                        <div className="text-sm text-gray-500">{history.studentEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{history.className}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{history.teacherName || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(history.paymentAmount, history.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700 capitalize">{history.paymentMethod === 'CASH' ? 'Efectivo' : history.paymentMethod}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{history.approvedByName || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {history.paymentStatus === 'PAID' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Confirmado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Denegado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(history.updatedAt).toLocaleDateString('es-ES', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleReversePayment(history.enrollmentId, history.paymentStatus)}
                        disabled={reversingIds.has(history.enrollmentId)}
                        className="text-sm text-accent-600 hover:text-accent-800 disabled:opacity-50"
                      >
                        {reversingIds.has(history.enrollmentId) ? 'Procesando...' : 'Revertir'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
