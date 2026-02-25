'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface StudentPayment {
  enrollmentId: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentAmount: number;
  currency: string;
  classId: string;
  className: string;
  academyName: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PAID: { label: 'Pagado', className: 'bg-green-100 text-green-700' },
  COMPLETED: { label: 'Completado', className: 'bg-green-100 text-green-700' },
  PENDING: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-700' },
  REJECTED: { label: 'Rechazado', className: 'bg-red-100 text-red-700' },
};

const METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  bizum: 'Bizum',
  stripe: 'Tarjeta / Stripe',
  manual: 'Manual',
};

export default function StudentPagosPage() {
  const [payments, setPayments] = useState<StudentPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient('/payments/my-payments');
        const json = await res.json() as { data: StudentPayment[]; success: boolean };
        if (json?.success && json.data) setPayments(json.data);
      } catch {
        // silently fail — empty state shown
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalPaid = payments
    .filter(p => p.paymentStatus === 'PAID' || p.paymentStatus === 'COMPLETED')
    .reduce((sum, p) => sum + (p.paymentAmount ?? 0), 0);

  const currency = payments[0]?.currency ?? 'EUR';
  const currencySymbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Mis Pagos</h1>
        <p className="text-sm text-gray-500 mt-1">
          Historial de pagos realizados a tus academias
        </p>
      </div>

      {/* Summary card */}
      {!loading && payments.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 flex items-center gap-4">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total abonado</p>
            <p className="text-xl font-bold text-gray-900">
              {currencySymbol}{totalPaid.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      {/* Payments list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <p className="text-sm">No tienes pagos registrados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const status = STATUS_LABELS[p.paymentStatus] ?? { label: p.paymentStatus, className: 'bg-gray-100 text-gray-600' };
            const method = METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod;
            const date = p.createdAt
              ? new Date(p.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
              : '—';
            return (
              <div
                key={p.enrollmentId}
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.className}</p>
                  <p className="text-xs text-gray-400 truncate">{p.academyName} · {method} · {date}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.className}`}>
                    {status.label}
                  </span>
                  <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">
                    {currencySymbol}{(p.paymentAmount ?? 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
