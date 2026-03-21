'use client';

import { useState, useMemo } from 'react';
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

  const [searchStudent, setSearchStudent] = useState('');

  const searchFilteredClasses = useMemo(() => {
    if (!searchStudent.trim()) return filteredClasses;
    const q = searchStudent.toLowerCase();
    return filteredClasses
      .map(cls => ({
        ...cls,
        topics: cls.topics.map(topic => ({
          ...topic,
          lessons: topic.lessons.map(lesson => ({
            ...lesson,
            ratings: lesson.ratings.filter(r => r.studentName.toLowerCase().includes(q)),
          })).filter(l => l.ratings.length > 0),
        })).filter(t => t.lessons.length > 0),
      }))
      .filter(c => c.topics.length > 0);
  }, [filteredClasses, searchStudent]);

  if (loading) {
    return <SkeletonFeedback />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {isAdmin ? 'Valoraciones de Estudiantes' : 'Valoraciones de Estudiantes'}
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
            <div className="relative w-full sm:w-48">
              <input
                type="text"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                placeholder="Buscar estudiante..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
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
        classes={searchFilteredClasses}
        loading={loading}
        showClassFilter={false}
        onRatingsViewed={handleRatingsViewed}
      />
    </div>
  );
}
