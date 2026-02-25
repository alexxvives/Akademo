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

const STATUS_CONFIG: Record<string, { label: string; dotColor: string; textColor: string; bgColor: string }> = {
  PAID:         { label: 'Pagado',            dotColor: 'bg-green-500',  textColor: 'text-green-700',  bgColor: 'bg-green-50'  },
  COMPLETED:    { label: 'Completado',        dotColor: 'bg-green-500',  textColor: 'text-green-700',  bgColor: 'bg-green-50'  },
  PENDING:      { label: 'Pendiente',         dotColor: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
  CASH_PENDING: { label: 'Pago en efectivo',  dotColor: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
  REJECTED:     { label: 'Rechazado',         dotColor: 'bg-red-500',    textColor: 'text-red-700',    bgColor: 'bg-red-50'    },
};

const METHOD_LABELS: Record<string, string> = {
  cash:   'Efectivo',
  bizum:  'Bizum',
  stripe: 'Tarjeta',
  manual: 'Manual',
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, dotColor: 'bg-gray-400', textColor: 'text-gray-600', bgColor: 'bg-gray-50' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bgColor} ${cfg.textColor}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dotColor}`} />
      {cfg.label}
    </span>
  );
}

function isPending(status: string) {
  return status === 'PENDING' || status === 'CASH_PENDING';
}

export default function StudentPagosPage() {
  const [payments, setPayments] = useState<StudentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCollapsed, setPendingCollapsed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient('/payments/my-payments');
        const json = await res.json() as { data: StudentPayment[]; success: boolean };
        if (json?.success && json.data) setPayments(json.data);
      } catch { /* show empty state */ }
      finally { setLoading(false); }
    })();
  }, []);

  const currency = payments[0]?.currency ?? 'EUR';
  const symbol   = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency;
  const fmt      = (n: number) => `${symbol}${n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtDate  = (s: string) => s ? new Date(s).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const pending      = payments.filter(p => isPending(p.paymentStatus));
  const history      = payments.filter(p => !isPending(p.paymentStatus));
  const totalPaid    = history.filter(p => p.paymentStatus === 'PAID' || p.paymentStatus === 'COMPLETED').reduce((s, p) => s + (p.paymentAmount ?? 0), 0);
  const totalPending = pending.reduce((s, p) => s + (p.paymentAmount ?? 0), 0);

  const TableRow = ({ p }: { p: StudentPayment }) => (
    <tr className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
      <td className="px-4 py-3 whitespace-nowrap">
        <StatusBadge status={p.paymentStatus} />
      </td>
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-gray-900">{p.className}</p>
        <p className="text-xs text-gray-400 mt-0.5">{p.academyName}</p>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap hidden sm:table-cell">
        {METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod ?? '—'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap hidden md:table-cell">
        {fmtDate(p.createdAt)}
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right whitespace-nowrap">
        {fmt(p.paymentAmount ?? 0)}
      </td>
    </tr>
  );

  const TableHead = () => (
    <thead className="bg-gray-50 border-b border-gray-200">
      <tr>
        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asignatura</th>
        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Método</th>
        <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Fecha</th>
        <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Importe</th>
      </tr>
    </thead>
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Mis Pagos</h1>
        <p className="text-sm text-gray-500 mt-1">Historial de pagos a tus academias</p>
      </div>



      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl flex flex-col items-center justify-center py-20 text-gray-400">
          <svg className="w-10 h-10 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <p className="text-sm">No tienes pagos registrados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pending section */}
          {pending.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setPendingCollapsed(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-yellow-50 border-b border-yellow-100 hover:bg-yellow-100/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-yellow-800">Pendiente de pago</span>
                  <span className="text-xs bg-yellow-200 text-yellow-700 px-2 py-0.5 rounded-full font-medium">{pending.length}</span>
                </div>
                <svg
                  className={`w-4 h-4 text-yellow-600 transition-transform ${pendingCollapsed ? '' : 'rotate-90'}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {!pendingCollapsed && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <TableHead />
                    <tbody>
                      {pending.map(p => <TableRow key={p.enrollmentId} p={p} />)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* History section */}
          {history.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">Historial de pagos</span>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">{history.length}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <TableHead />
                  <tbody>
                    {history.map(p => <TableRow key={p.enrollmentId} p={p} />)}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
