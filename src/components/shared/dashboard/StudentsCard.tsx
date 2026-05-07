'use client';

import { AnimatedNumber, AnimatedCurrency, EmptyState, TooltipStat } from './DashboardHelpers';
import type { EnrolledStudent, PendingEnrollment, StudentPaymentStatus, PaymentStats } from './types';

export interface StudentsCardProps {
  isAcademy: boolean;
  filteredStudents: EnrolledStudent[];
  pendingEnrollments: PendingEnrollment[];
  rejectedCount: number;
  uniqueStudentCount: number;
  enrolledStudents: EnrolledStudent[];
  selectedClass: string;
  selectedAcademy: string;
  displayedPaymentStatus: StudentPaymentStatus;
  paymentStats: PaymentStats;
}

export function StudentsCard(props: StudentsCardProps) {
  const { isAcademy, filteredStudents, pendingEnrollments, rejectedCount } = props;
  const hasData = filteredStudents.length > 0 || pendingEnrollments.length > 0 || rejectedCount > 0;
  return (
    <div className={`bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm h-full ${isAcademy ? 'order-1 lg:order-1' : ''}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-6">Estudiantes</h3>
      {hasData ? (
        <AcademyStudentsContent {...props} />
      ) : (
        <EmptyState icon="users" title="Sin estudiantes" subtitle="Cuando los estudiantes se inscriban aparecerán aquí" />
      )}
    </div>
  );
}

function AcademyStudentsContent({ uniqueStudentCount, displayedPaymentStatus, filteredStudents, paymentStats }: StudentsCardProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="flex flex-col gap-3">
          {/* Estudiantes box */}
          <div className="flex-1 flex items-center p-3 bg-gray-50 rounded-lg gap-3">
            <div className="flex flex-col items-center justify-center shrink-0 min-w-[72px]">
              <AnimatedNumber value={uniqueStudentCount} className="text-3xl sm:text-4xl font-bold text-gray-900" />
              <div className="text-xs text-gray-500">Estudiantes</div>
            </div>
            <div className="flex-1 ml-2 pl-2 border-l border-gray-200 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500">al día</span>
                <AnimatedNumber value={displayedPaymentStatus?.uniqueAlDia ?? 0} className="text-base font-bold text-green-600" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500">atrasados</span>
                <AnimatedNumber value={displayedPaymentStatus?.uniqueAtrasados ?? 0} className="text-base font-bold text-red-600" />
              </div>
            </div>
          </div>
          {/* Matrículas box */}
          <div className="flex-1 flex items-center p-3 bg-gray-50 rounded-lg gap-3">
            <div className="flex flex-col items-center justify-center shrink-0 min-w-[72px]">
              <AnimatedNumber value={filteredStudents.length} className="text-3xl sm:text-4xl font-bold text-gray-900" />
              <div className="text-xs text-gray-500">Matrículas</div>
            </div>
            <div className="flex-1 ml-2 pl-2 border-l border-gray-200 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500">al día</span>
                <AnimatedNumber value={displayedPaymentStatus?.alDia ?? 0} className="text-base font-bold text-green-600" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500">atrasados</span>
                <AnimatedNumber value={displayedPaymentStatus?.atrasados ?? 0} className="text-base font-bold text-red-600" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex-1 flex flex-col items-center justify-center p-3 bg-green-50 rounded-lg">
            <AnimatedCurrency value={paymentStats.totalPaid} className="text-3xl sm:text-4xl font-bold text-green-700 mb-1" />
            <div className="text-xs text-gray-500">Total Cobrado</div>
          </div>
          <div className="flex-1 flex items-center justify-center gap-3 p-3 bg-gray-50 rounded-lg">
            {[{ label: 'Transferencia', value: paymentStats.transferenciaCount }, { label: 'Efectivo', value: paymentStats.cashCount }, { label: 'Stripe', value: paymentStats.stripeCount }].map(m => (
              <div key={m.label} className="text-center min-w-[60px]">
                <div className="text-sm text-gray-500 mb-0.5">{m.label}</div>
                <AnimatedNumber value={m.value} className="text-2xl font-bold text-gray-900" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Preserved from original (_renderAdminStudentsContent) — currently unused
export function AdminStudentsContent({ filteredStudents, selectedClass, selectedAcademy, pendingEnrollments, rejectedCount, enrolledStudents }: StudentsCardProps) {
  const filteredPending = selectedClass !== 'all'
    ? pendingEnrollments.filter(p => p.class.id === selectedClass)
    : selectedAcademy !== 'all'
      ? pendingEnrollments.filter(p => p.class.academyId === selectedAcademy)
      : pendingEnrollments;
  const filteredRejected = selectedClass === 'all' && selectedAcademy === 'all'
    ? rejectedCount
    : Math.round(rejectedCount * (filteredStudents.length / (enrolledStudents.length || 1)));
  return (
    <div className="space-y-6">
      <div className="text-center">
        <AnimatedNumber value={filteredStudents.length} className="text-3xl sm:text-5xl font-bold text-gray-900 mb-2" />
        <div className="text-sm text-gray-500">{selectedClass === 'all' ? 'Número de matriculados' : 'matriculados en esta clase'}</div>
      </div>
      <div className="flex justify-between gap-4 pt-4 border-t border-gray-100">
        <TooltipStat value={Math.ceil(filteredStudents.length * 1.05)} color="green" label="aceptados" tooltip="Estudiantes aprobados (5% más que matriculados)" />
        <TooltipStat value={filteredPending.length} color="amber" label="pendientes" tooltip="Esperando aprobación" />
        <TooltipStat value={filteredRejected} color="red" label="rechazados" tooltip="Solicitudes rechazadas" />
      </div>
    </div>
  );
}
