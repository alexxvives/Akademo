'use client';

import { SkeletonPayments } from '@/components/ui/SkeletonLoader';
import { StudentPaymentDetailModal } from '@/components/shared/StudentPaymentDetailModal';
import { usePagosData } from './usePagosData';
import { usePagosActions } from './usePagosActions';
import { PagosFilters } from './PagosFilters';
import { PagosPendingTable } from './PagosPendingTable';
import { PagosHistoryTable } from './PagosHistoryTable';
import { PagosRegisterModal } from './PagosRegisterModal';
import type { PagosPageProps } from './pagos-types';

export function PagosPage({ role }: PagosPageProps) {
  const state = usePagosData(role);
  const actions = usePagosActions(state);

  if (state.loading) return <SkeletonPayments />;

  return (
    <div className="space-y-6 pb-8">
      <PagosFilters state={state} />
      <div className="space-y-4">
        {state.filteredPendingPayments.length === 0 && state.filteredPaymentHistory.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 sm:p-12 text-center">
            <div className="text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay pagos</h3>
              <p className="text-gray-500">
                {state.searchQuery || state.selectedClass !== 'all' || (state.isAdmin && state.selectedAcademy !== 'all')
                  ? 'No se encontraron pagos con los filtros aplicados'
                  : 'Los pagos aparecerán aquí cuando se registren'}
              </p>
            </div>
          </div>
        )}
        {state.filteredPendingPayments.length > 0 && (
          <PagosPendingTable state={state} actions={actions} hasHistory={state.filteredPaymentHistory.length > 0} />
        )}
        {state.filteredPaymentHistory.length > 0 && (
          <PagosHistoryTable state={state} actions={actions} />
        )}
      </div>

      {state.isAcademy && state.showRegisterModal && (
        <PagosRegisterModal state={state} actions={actions} />
      )}

      {state.selectedStudent && (
        <StudentPaymentDetailModal
          isOpen={state.selectedStudent !== null}
          onClose={() => state.setSelectedStudent(null)}
          studentName={state.selectedStudent.name}
          studentEmail={state.selectedStudent.email}
          className={state.selectedStudent.className}
          payments={state.selectedStudent.paymentData?.payments || []}
          paymentFrequency={state.selectedStudent.paymentData?.paymentFrequency || 'ONE_TIME'}
          enrollmentDate={state.selectedStudent.paymentData?.enrollmentDate || state.selectedStudent.enrollmentDate}
          availableClasses={(state.studentEnrollments[state.selectedStudent.studentId] || []).map(e => ({
            id: e.classId,
            name: e.className,
          }))}
          currentClassId={state.selectedStudent.classId || 'all'}
          onClassChange={async (classId) => {
            if (classId === 'all') {
              await actions.showStudentPaymentHistory(
                state.selectedStudent!.studentId, state.selectedStudent!.name,
                state.selectedStudent!.email, 'Todas las asignaturas',
                state.selectedStudent!.enrollmentDate, classId,
              );
            } else {
              const sc = state.studentEnrollments[state.selectedStudent!.studentId]?.find(c => c.classId === classId);
              if (sc) {
                await actions.showStudentPaymentHistory(
                  state.selectedStudent!.studentId, state.selectedStudent!.name,
                  state.selectedStudent!.email, sc.className,
                  state.selectedStudent!.enrollmentDate, classId,
                );
              }
            }
          }}
        />
      )}
    </div>
  );
}
