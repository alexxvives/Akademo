'use client';

import { DeleteIcon } from '@/components/ui/DeleteIcon';
import type { PagosState } from './usePagosData';
import type { PagosActions } from './usePagosActions';

interface PagosHistoryTableProps {
  state: PagosState;
  actions: PagosActions;
}

export function PagosHistoryTable({ state, actions }: PagosHistoryTableProps) {
  const {
    isAdmin, isAcademy, filteredPaymentHistory, paymentStatus,
    deletingPaymentId, reversingPaymentId,
  } = state;
  const {
    formatCurrency, showStudentPaymentHistory,
    handleEditPayment, handleReversePayment, handleDeletePayment,
  } = actions;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-green-50 border-b border-green-100 flex items-center gap-2">
        <span className="text-sm font-semibold text-green-800">Historial de pagos</span>
        <span className="text-xs bg-green-200 text-green-700 px-2 py-0.5 rounded-full font-medium">{filteredPaymentHistory.length}</span>
      </div>
      <div className="max-h-[630px] overflow-y-auto overflow-x-auto">
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
            {filteredPaymentHistory.map((history, index) => (
              <tr key={`history-${history.enrollmentId}-${index}`} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{history.studentFirstName} {history.studentLastName}</div>
                    <div className="text-sm text-gray-500">{history.studentEmail}</div>
                  </div>
                </td>
                {isAdmin && (
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{history.academyName || '-'}</div>
                  </td>
                )}
                <td className="px-3 sm:px-6 py-4">
                  <div className="text-sm text-gray-900">{history.className}</div>
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">{formatCurrency(history.paymentAmount, history.currency)}</div>
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-700 capitalize">
                    {history.paymentMethod.toLowerCase() === 'cash' || history.paymentMethod === 'CASH'
                      ? 'Efectivo'
                      : history.paymentMethod.toLowerCase() === 'transferencia' || history.paymentMethod === 'TRANSFERENCIA'
                      ? 'Transferencia'
                      : history.paymentMethod.toLowerCase() === 'stripe' || history.paymentMethod === 'STRIPE'
                      ? 'Stripe'
                      : 'Desconocido'}
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(history.createdAt || history.updatedAt || history.approvedAt).toLocaleDateString('es-ES', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        showStudentPaymentHistory(
                          history.studentId || '', `${history.studentFirstName} ${history.studentLastName}`,
                          history.studentEmail, history.className,
                          history.createdAt || history.updatedAt || history.approvedAt, history.classId,
                        );
                      }}
                      className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Ver historial"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                    {(isAcademy || isAdmin) && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditPayment(history); }}
                          className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Editar pago"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        {(history.paymentStatus === 'PAID' || history.paymentStatus === 'COMPLETED') ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleReversePayment(history.paymentId); }}
                            disabled={reversingPaymentId === history.paymentId || paymentStatus === 'NOT PAID'}
                            className="p-1.5 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                            title={paymentStatus === 'NOT PAID' ? 'Disponible solo en academias activadas' : 'Cancelar pago (volver a pendiente)'}
                          >
                            {reversingPaymentId === history.paymentId ? (
                              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeletePayment(history.paymentId); }}
                            disabled={deletingPaymentId === history.paymentId || paymentStatus === 'NOT PAID'}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                            title={paymentStatus === 'NOT PAID' ? 'Disponible solo en academias activadas' : 'Eliminar pago'}
                          >
                            {deletingPaymentId === history.paymentId ? (
                              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <DeleteIcon size={16} />
                            )}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
