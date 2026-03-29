'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import DocumentSigningModal from '@/components/DocumentSigningModal';
import PaymentModal from '@/components/PaymentModal';
import { SkeletonClasses } from '@/components/ui/SkeletonLoader';
import { useStudentClasses } from './useStudentClasses';
import EmptyClassesView from './EmptyClassesView';
import ClassCard from './ClassCard';
import { CarreraFilterDropdown, buildFilterGroups, matchesFilter } from '@/components/ui/CarreraFilterDropdown';

export default function StudentClassesPage() {
  const {
    enrolledClasses,
    activeStreams,
    academyName,
    loading,
    verifying,
    signingClass,
    setSigningClass,
    viewingDocClass,
    setViewingDocClass,
    payingClass,
    setPayingClass,
    handleClassClick,
    handleSign,
    loadData,
  } = useStudentClasses();

  const [filterKey, setFilterKey] = useState('');
  const filterGroups = useMemo(() => buildFilterGroups(enrolledClasses), [enrolledClasses]);
  const hasFilter = Object.keys(filterGroups).length > 0;
  const filtered = useMemo(() => enrolledClasses.filter(c => matchesFilter(c, filterKey)), [enrolledClasses, filterKey]);

  if (loading || verifying) {
    return <SkeletonClasses />;
  }

  if (enrolledClasses.length === 0) {
    return <EmptyClassesView />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">Mis Asignaturas</h1>
            <Link
              href="/dashboard/student/enrolled-academies/subjects"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Unirse a Más Clases
            </Link>
          </div>
          {academyName && <p className="text-sm text-gray-500 mt-1">{academyName}</p>}
        </div>
        {hasFilter && (
          <CarreraFilterDropdown groups={filterGroups} value={filterKey} onChange={setFilterKey} />
        )}
      </div>

      <div className="space-y-4">
        {filtered.map((classItem) => (
          <ClassCard
            key={classItem.id}
            classItem={classItem}
            activeStreams={activeStreams}
            onClassClick={handleClassClick}
            onViewDocument={(c) => setViewingDocClass(c)}
          />
        ))}
      </div>

      <PaymentModal
        isOpen={!!payingClass}
        onClose={() => setPayingClass(null)}
        classId={payingClass?.id || ''}
        className={payingClass?.name || ''}
        academyName={payingClass?.academyName || ''}
        currentPaymentStatus={payingClass?.paymentStatus || 'PENDING'}
        currentPaymentMethod={payingClass?.paymentMethod || ''}
        monthlyPrice={payingClass?.monthlyPrice ?? null}
        oneTimePrice={payingClass?.oneTimePrice ?? null}
        maxStudents={payingClass?.maxStudents}
        currentStudentCount={payingClass?.studentCount || 0}
        firstPaymentAmount={payingClass?.firstPaymentAmount}
        missedCycles={payingClass?.missedCycles}
        onPaymentComplete={() => {
          setPayingClass(null);
          loadData();
        }}
      />

      <DocumentSigningModal
        isOpen={!!signingClass}
        onClose={() => setSigningClass(null)}
        onSign={handleSign}
        classId={signingClass?.id || ''}
        className={signingClass?.name || ''}
      />

      <DocumentSigningModal
        isOpen={!!viewingDocClass}
        onClose={() => setViewingDocClass(null)}
        onSign={async () => {}}
        classId={viewingDocClass?.id || ''}
        className={viewingDocClass?.name || ''}
        readOnly
      />
    </div>
  );
}
