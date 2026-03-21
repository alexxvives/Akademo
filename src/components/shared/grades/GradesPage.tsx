'use client';

import { useMemo } from 'react';
import { ClassSearchDropdown } from '@/components/ui/ClassSearchDropdown';
import { AcademySearchDropdown } from '@/components/ui/AcademySearchDropdown';
import { useGradesData } from './useGradesData';
import { GradesChart } from './GradesChart';
import { GradesTable } from './GradesTable';
import type { GradesPageProps } from './types';

export function GradesPage({ role }: GradesPageProps) {
  const {
    grades, averages, loading, selectedClass, setSelectedClass,
    classes, searchQuery, setSearchQuery, academyName,
    academies, selectedAcademy, setSelectedAcademy,
    activePeriodId, isClassInPeriod, setGrades,
  } = useGradesData(role);

  // Filtering
  const filteredGrades = useMemo(() => {
    let result = grades;
    if (selectedClass === 'all' && activePeriodId !== 'all') {
      const periodClassNames = new Set(
        classes.filter(c => isClassInPeriod(c.startDate ?? null)).map(c => c.name)
      );
      result = result.filter(g => periodClassNames.has(g.className));
    }
    if (!searchQuery.trim()) return result;
    const q = searchQuery.toLowerCase();
    return result.filter(
      (g) => g.studentName.toLowerCase().includes(q) || g.studentEmail.toLowerCase().includes(q)
    );
  }, [grades, searchQuery, selectedClass, activePeriodId, classes, isClassInPeriod]);

  const filteredAverages = useMemo(() => {
    let result = averages;
    if (selectedClass === 'all' && activePeriodId !== 'all') {
      const periodClassNames = new Set(
        classes.filter(c => isClassInPeriod(c.startDate ?? null)).map(c => c.name)
      );
      result = result.filter(a =>
        grades.some(g => g.studentId === a.studentId && periodClassNames.has(g.className))
      );
    }
    if (!searchQuery.trim()) return result;
    const q = searchQuery.toLowerCase();
    return result.filter((a) => a.studentName.toLowerCase().includes(q));
  }, [averages, grades, searchQuery, selectedClass, activePeriodId, classes, isClassInPeriod]);

  const top10Averages = filteredAverages.slice(0, 10);

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-10 bg-gray-200 rounded w-full md:w-64"></div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="h-80 bg-gray-100 rounded"></div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="h-5 bg-gray-200 rounded w-40"></div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-6 py-4 border-b border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (((role === 'ACADEMY' || role === 'TEACHER') && classes.length === 0) || (role === 'ADMIN' && academies.length === 0)) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Calificaciones</h1>
          <p className="text-sm text-gray-500 mt-1">{role === 'ADMIN' ? 'AKADEMO PLATFORM' : academyName || 'AKADEMO'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-12 text-center">
          <div className="text-gray-900 font-medium mb-2">
            {role === 'ADMIN' ? 'No hay academias disponibles' : 'No hay asignaturas disponibles'}
          </div>
          <p className="text-gray-500">
            {role === 'ADMIN'
              ? 'No hay academias registradas en la plataforma.'
              : 'Necesitas crear asignaturas para ver calificaciones.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Calificaciones</h1>
          <p className="text-sm text-gray-500 mt-1">{role === 'ADMIN' ? 'AKADEMO PLATFORM' : academyName || 'AKADEMO'}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar estudiante..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-48 pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            <svg
              className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Class filter - cascaded behind academy for admin */}
          {(role !== 'ADMIN' || (selectedAcademy !== 'all' && selectedAcademy !== '')) && (
            <ClassSearchDropdown
              classes={activePeriodId === 'all' ? classes : classes.filter(c => isClassInPeriod(c.startDate))}
              value={selectedClass}
              onChange={setSelectedClass}
              allLabel="Todas las asignaturas"
              className="w-full sm:w-56"
              disabled={classes.length === 0}
            />
          )}

          {/* Admin: academy filter */}
          {role === 'ADMIN' && (
            <AcademySearchDropdown
              academies={academies}
              value={selectedAcademy}
              onChange={(val) => { setSelectedAcademy(val); if (val === 'all') setSelectedClass('all'); }}
              allLabel="Todas las academias"
              className="w-full sm:w-56"
            />
          )}
        </div>
      </div>

      {filteredAverages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-12 text-center">
          <p className="text-gray-500">
            {selectedClass === 'all'
              ? 'No hay calificaciones para mostrar. Asegúrate de haber calificado algunas entregas de ejercicios.'
              : 'No hay calificaciones para mostrar en esta asignatura'}
          </p>
        </div>
      ) : (
        <>
          <GradesChart top10Averages={top10Averages} />
          <GradesTable
            filteredGrades={filteredGrades}
            filteredAveragesCount={filteredAverages.length}
            role={role}
            onGradesUpdate={setGrades}
          />
        </>
      )}
    </div>
  );
}
