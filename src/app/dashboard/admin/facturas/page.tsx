'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { SkeletonTable } from '@/components/ui/SkeletonLoader';

interface Payment {
  id: string;
  type: 'STUDENT_TO_ACADEMY' | 'ACADEMY_TO_PLATFORM';
  payerId: string;
  payerType: 'STUDENT' | 'ACADEMY';
  payerName: string;
  payerEmail: string;
  receiverId?: string;
  receiverName?: string;
  academyName?: string;
  className?: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  stripePaymentId?: string;
  paymentMethod?: string;
  description?: string;
  createdAt: string;
  completedAt?: string;
}

export default function AdminFacturas() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'STUDENT_TO_ACADEMY' | 'ACADEMY_TO_PLATFORM'>('ALL');

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const url = filter === 'ALL' ? '/admin/payments' : `/admin/payments?type=${filter}`;
      const res = await apiClient(url);
      const result = await res.json();
      if (result.success) {
        setPayments(result.data || []);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const _totalAmount = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);

  const _studentPaymentsTotal = payments
    .filter(p => p.type === 'STUDENT_TO_ACADEMY' && p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);

  const _academyPaymentsTotal = payments
    .filter(p => p.type === 'ACADEMY_TO_PLATFORM' && p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);

  const formatAmount = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      COMPLETED: 'text-green-600',
      PENDING: 'text-yellow-600',
      FAILED: 'text-red-600',
      REFUNDED: 'text-gray-600',
    };
    const labels = {
      COMPLETED: 'COMPLETADO',
      PENDING: 'PENDIENTE',
      FAILED: 'FALLIDO',
      REFUNDED: 'REEMBOLSADO',
    };
    return (
      <span className={`text-xs font-bold uppercase ${colors[status as keyof typeof colors] || colors.PENDING}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const getTypeLabel = (type: string) => {
    if (type === 'STUDENT_TO_ACADEMY') {
      return 'ESTUDIANTE → ACADEMIA';
    }
    return 'ACADEMIA → AKADEMO';
  };

  if (loading) {
    return <SkeletonTable rows={10} cols={6} />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Facturas y Pagos</h1>
          <p className="text-sm text-gray-500 mt-1">Historial de pagos y transacciones</p>
        </div>
        
        {/* Filters in top-right */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="appearance-none w-full sm:w-48 pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">Todos</option>
              <option value="STUDENT_TO_ACADEMY">Estudiante → Academia</option>
              <option value="ACADEMY_TO_PLATFORM">Academia → AKADEMO</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      {payments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay pagos</h3>
          <p className="text-gray-500">Los pagos aparecerán aquí cuando se realicen transacciones</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pagador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receptor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {getTypeLabel(payment.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{payment.payerName}</div>
                        <div className="text-sm text-gray-500">{payment.payerEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {payment.type === 'STUDENT_TO_ACADEMY' ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">{payment.academyName || payment.receiverName || 'N/A'}</div>
                          {payment.className && <div className="text-sm text-gray-500">{payment.className}</div>}
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-gray-900">Plataforma AKADEMO</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatAmount(payment.amount, payment.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500 capitalize">
                        {payment.paymentMethod || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(payment.createdAt).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(payment.createdAt).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
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
