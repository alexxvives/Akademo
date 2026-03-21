'use client';

import { FeedbackView } from '../FeedbackView';
import { ClassSearchDropdown } from '@/components/ui/ClassSearchDropdown';
import { AcademySearchDropdown } from '@/components/ui/AcademySearchDropdown';
import { SkeletonFeedback } from '@/components/ui/SkeletonLoader';
import type { FeedbackPageProps } from './feedback-types';
import { useFeedbackData } from './useFeedbackData';

export function FeedbackPage({ role }: FeedbackPageProps) {
  const {
    loading,
    classes,
    academyName,
    academies,
    selectedAcademy,
    selectedClass,
    setSelectedAcademy,
    setSelectedClass,
    filteredClasses,
    filteredClassOptions,
    handleRatingsViewed,
    isAcademy,
    isTeacher,
    isAdmin,
    activePeriodId,
    isClassInPeriod,
  } = useFeedbackData(role);

  if (loading) {
    return <SkeletonFeedback />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {isAdmin ? 'Feedback de Estudiantes' : 'Valoraciones de Estudiantes'}
          </h1>
          {(isAcademy || isTeacher) && academyName && (
            <p className="text-sm text-gray-500 mt-1">{academyName}</p>
          )}
          {isAdmin && (
            <p className="text-gray-600 text-sm mt-1">Todas las academias</p>
          )}
        </div>

        {/* Academy/Teacher class filter */}
        {(isAcademy || isTeacher) && classes.length > 1 && (
          <ClassSearchDropdown
            classes={activePeriodId === 'all' ? classes : classes.filter(c => isClassInPeriod(c.startDate))}
            value={selectedClass}
            onChange={setSelectedClass}
            allLabel="Todas las asignaturas"
            className="w-full sm:w-56"
          />
        )}

        {/* Admin filters */}
        {isAdmin && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {selectedAcademy !== 'all' && filteredClassOptions.length > 0 && (
              <ClassSearchDropdown
                classes={filteredClassOptions}
                value={selectedClass}
                onChange={setSelectedClass}
                allLabel="Todas las clases"
                className="w-full sm:w-56"
              />
            )}

            <AcademySearchDropdown
              academies={academies}
              value={selectedAcademy}
              onChange={(value) => {
                setSelectedAcademy(value);
                setSelectedClass('all');
              }}
              allLabel="Todas las academias"
              allValue="all"
              className="w-full sm:w-56"
            />
          </div>
        )}
      </div>

      <FeedbackView
        classes={filteredClasses}
        loading={loading}
        showClassFilter={false}
        onRatingsViewed={handleRatingsViewed}
      />
    </div>
  );
}
