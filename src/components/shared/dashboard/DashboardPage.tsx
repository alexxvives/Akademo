'use client';

import { SkeletonDashboard } from '@/components/ui/SkeletonLoader';
import { ClassSearchDropdown } from '@/components/ui/ClassSearchDropdown';
import { AcademySearchDropdown } from '@/components/ui/AcademySearchDropdown';
import { useDashboardData } from './useDashboardData';
import { useDashboardComputed } from './useDashboardComputed';
import { EngagementCard, RatingsCard, ActivityCard } from './DashboardCards';
import { StudentsCard } from './StudentsCard';
import type { DashboardPageProps } from './types';

export function DashboardPage({ role }: DashboardPageProps) {
  const data = useDashboardData(role);
  const computed = useDashboardComputed({
    role,
    enrolledStudents: data.enrolledStudents,
    selectedAcademy: data.selectedAcademy,
    selectedClass: data.selectedClass,
    classes: data.classes,
    allStreams: data.allStreams,
    paymentStatus: data.paymentStatus,
    studentPaymentStatus: data.studentPaymentStatus,
    classWatchTime: data.classWatchTime,
    allCompletedPayments: data.allCompletedPayments,
  });

  if (data.loading) return <SkeletonDashboard />;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Panel de Control</h1>
          <p className="text-sm text-gray-500 mt-1">
            {data.isAcademy ? (data.academyInfo?.name || '') : 'AKADEMO PLATFORM'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {data.isAdmin && data.selectedAcademy !== 'all' && (
            <ClassSearchDropdown
              classes={data.academyClasses}
              value={data.selectedClass}
              onChange={data.setSelectedClass}
              allLabel="Todas las clases"
              className="w-full sm:w-56"
            />
          )}
          {data.isAdmin && data.academies.length > 0 && (
            <AcademySearchDropdown
              academies={data.academies}
              value={data.selectedAcademy}
              onChange={data.setSelectedAcademy}
              allLabel="Todas las Academias"
              allValue="all"
              className="w-full sm:w-56"
            />
          )}
          {data.isAcademy && data.classes.length > 0 && (
            <ClassSearchDropdown
              classes={data.activePeriodId === 'all' ? data.classes : data.classes.filter(c => data.isClassInPeriod(c.startDate))}
              value={data.selectedClass}
              onChange={data.setSelectedClass}
              allLabel="Todas las asignaturas"
              className="w-full sm:w-56"
            />
          )}
        </div>
      </div>

      {/* 2×2 Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StudentsCard
          isAcademy={data.isAcademy}
          filteredStudents={computed.filteredStudents}
          pendingEnrollments={data.pendingEnrollments}
          rejectedCount={data.rejectedCount}
          uniqueStudentCount={computed.uniqueStudentCount}
          enrolledStudents={data.enrolledStudents}
          selectedClass={data.selectedClass}
          selectedAcademy={data.selectedAcademy}
          displayedPaymentStatus={computed.displayedPaymentStatus}
          paymentStats={computed.paymentStats}
        />
        <EngagementCard
          isAcademy={data.isAcademy}
          isAdmin={data.isAdmin}
          filteredStudents={computed.filteredStudents}
          avgLessonProgress={computed.avgLessonProgress}
          filteredClassWatchTime={computed.filteredClassWatchTime}
          filteredStreamStats={computed.filteredStreamStats}
        />
        <RatingsCard
          isAcademy={data.isAcademy}
          isAdmin={data.isAdmin}
          ratingsData={data.ratingsData}
          selectedAcademy={data.selectedAcademy}
          selectedClass={data.selectedClass}
          activePeriodId={data.activePeriodId}
          classes={data.classes}
          isClassInPeriod={data.isClassInPeriod}
          paymentStatus={data.paymentStatus}
        />
        <ActivityCard
          isAcademy={data.isAcademy}
          filteredStudents={computed.filteredStudents}
        />
      </div>
    </div>
  );
}
