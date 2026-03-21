'use client';

import type { PagosState } from './usePagosData';
import type { PagosActions } from './usePagosActions';

interface PagosPendingTableProps {
  state: PagosState;
  actions: PagosActions;
}

export function PagosPendingTable({ state, actions }: PagosPendingTableProps) {
  const {
    isAdmin, isAcademy, filteredPendingPayments, processingIds,
    paymentStatus, pendingPaymentsCollapsed, setPendingPaymentsCollapsed,
  } = state;
  const { formatCurrency, showStudentPaymentHistory, handleApprove } = actions;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => {
          const next = !pendingPaymentsCollapsed;
          setPendingPaymentsCollapsed(next);
          sessionStorage.setItem('pagos_pending_collapsed', String(next));
        }}
        className="w-full flex items-center justify-between px-4 py-3 bg-yellow-50 border-b border-yellow-100 hover:bg-yellow-100/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-yellow-800">Pendiente de pago</span>
          <span className="text-xs bg-yellow-200 text-yellow-700 px-2 py-0.5 rounded-full font-medium">{filteredPendingPayments.length}</span>
        </div>
        <svg
          className={`w-4 h-4 text-yellow-600 transition-transform ${pendingPaymentsCollapsed ? '' : 'rotate-90'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {!pendingPaymentsCollapsed && (
        <div className="max-h-[250px] overflow-y-auto overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estudiante</th>
                {isAdmin && <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academia</th>}
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asignatura</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPendingPayments.map((payment) => (
                <tr key={`pending-${payment.enrollmentId}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{payment.studentFirstName} {payment.studentLastName}</div>
                      <div className="text-sm text-gray-500">{payment.studentEmail}</div>
                    </div>
                  </td>
                  {isAdmin && (
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{payment.academyName}</div>
                    </td>
                  )}
                  <td className="px-3 sm:px-6 py-4">
                    <div className="text-sm text-gray-900">{payment.className}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{formatCurrency(payment.paymentAmount, payment.currency)}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700 capitalize">
                      {payment.paymentMethod?.toUpperCase() === 'CASH' ? 'Efectivo' : payment.paymentMethod}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payment.enrolledAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          showStudentPaymentHistory(
                            payment.studentId, `${payment.studentFirstName} ${payment.studentLastName}`,
                            payment.studentEmail, payment.className, payment.enrolledAt, payment.classId,
                          );
                        }}
                        className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Ver historial"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                      {(isAcademy || isAdmin) && payment.paymentMethod !== 'stripe' && (
                        <button
                          onClick={(e) => {
                            if (paymentStatus === 'NOT PAID') { e.preventDefault(); e.stopPropagation(); return; }
                            e.stopPropagation();
                            handleApprove(payment.enrollmentId);
                          }}
                          disabled={processingIds.has(payment.enrollmentId) || paymentStatus === 'NOT PAID'}
                          className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                          title={paymentStatus === 'NOT PAID' ? 'Disponible solo en academias activadas' : 'Confirmar pago'}
                        >
                          {processingIds.has(payment.enrollmentId) ? (
                            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
