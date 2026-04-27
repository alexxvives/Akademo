'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { PagosState } from './usePagosData';
import type { PagosActions } from './usePagosActions';

interface PagosPendingTableProps {
  state: PagosState;
  actions: PagosActions;
  hasHistory?: boolean;
}

export function PagosPendingTable({ state, actions, hasHistory = false }: PagosPendingTableProps) {
  const {
    isAdmin, isAcademy, filteredPendingPayments, processingIds,
    paymentStatus, pendingPaymentsCollapsed, setPendingPaymentsCollapsed,
  } = state;
  const { formatCurrency, showStudentPaymentHistory, handleApprove, handleApproveAll, handleUndoApproveAll, handleDeletePayment } = actions;
  const { deletingPaymentId } = state;

  const [justApprovedIds, setJustApprovedIds] = useState<string[] | null>(null);
  const [approving, setApproving] = useState(false);
  const [showReminderConfirm, setShowReminderConfirm] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const UNDO_WINDOW = 15000;

  const startAcceptAll = useCallback(async () => {
    const ids = filteredPendingPayments
      .filter(p => p.paymentMethod !== 'stripe')
      .map(p => p.enrollmentId);
    if (ids.length === 0) return;
    setApproving(true);
    try {
      const approved = await handleApproveAll(ids);
      if (approved.length > 0) {
        setJustApprovedIds(approved);
        undoTimer.current = setTimeout(() => setJustApprovedIds(null), UNDO_WINDOW);
      }
    } finally {
      setApproving(false);
    }
  }, [filteredPendingPayments, handleApproveAll]);

  const doUndo = useCallback(async () => {
    if (!justApprovedIds) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setJustApprovedIds(null);
    await handleUndoApproveAll(justApprovedIds);
  }, [justApprovedIds, handleUndoApproveAll]);

  const handleSendReminder = useCallback(async () => {
    setSendingReminder(true);
    setShowReminderConfirm(false);
    try {
      const students = filteredPendingPayments.map(p => ({
        email: p.studentEmail,
        firstName: p.studentFirstName,
        className: p.className,
      }));
      const res = await apiClient('/payments/send-payment-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Recordatorio enviado a ${data.data.sent} estudiante${data.data.sent !== 1 ? 's' : ''}.${data.data.failed > 0 ? ` ${data.data.failed} fallido(s).` : ''}`);
      } else {
        alert('Error al enviar el recordatorio: ' + (data.error || 'Error desconocido'));
      }
    } catch {
      alert('Error de conexión al enviar el recordatorio.');
    } finally {
      setSendingReminder(false);
    }
  }, [filteredPendingPayments]);

  useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current); }, []);

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
          {isAcademy && paymentStatus !== 'NOT PAID' && (
            justApprovedIds ? (
              <button
                onClick={(e) => { e.stopPropagation(); void doUndo(); }}
                className="ml-2 text-xs font-medium px-3 py-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
              >
                Deshacer ({justApprovedIds.length})
              </button>
            ) : filteredPendingPayments.length > 0 ? (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); void startAcceptAll(); }}
                  disabled={approving}
                  className="ml-2 text-xs font-medium px-3 py-1 rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50"
                >
                  {approving ? 'Procesando…' : 'Aceptar todos'}
                </button>
                {showReminderConfirm ? (
                  <span className="ml-2 flex items-center gap-1">
                    <span className="text-xs text-yellow-800">¿Enviar a {filteredPendingPayments.length}?</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); void handleSendReminder(); }}
                      className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
                    >
                      Sí
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowReminderConfirm(false); }}
                      className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                    >
                      No
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowReminderConfirm(true); }}
                    disabled={sendingReminder}
                    className="ml-2 text-xs font-medium px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors disabled:opacity-50"
                  >
                    {sendingReminder ? 'Enviando…' : 'Enviar recordatorio'}
                  </button>
                )}
              </>
            ) : null
          )}
        </div>
        <svg
          className={`w-4 h-4 text-yellow-600 transition-transform ${pendingPaymentsCollapsed ? '' : 'rotate-90'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {!pendingPaymentsCollapsed && (
        <div className={`${hasHistory ? 'max-h-[250px]' : 'max-h-[calc(100vh-320px)]'} overflow-y-auto overflow-x-auto`}>
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
                        <>
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
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeletePayment(payment.enrollmentId); }}
                            disabled={deletingPaymentId === payment.enrollmentId || paymentStatus === 'NOT PAID'}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                            title={paymentStatus === 'NOT PAID' ? 'Disponible solo en academias activadas' : 'Eliminar pago pendiente'}
                          >
                            {deletingPaymentId === payment.enrollmentId ? (
                              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </>
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
