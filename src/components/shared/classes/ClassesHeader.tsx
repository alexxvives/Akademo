'use client';

import { useMemo } from 'react';
import { ClassSearchDropdown } from '@/components/ui/ClassSearchDropdown';
import { AcademySearchDropdown } from '@/components/ui/AcademySearchDropdown';
import type { Class, Academy, Teacher } from './types';

interface ClassesHeaderProps {
  role: 'ACADEMY' | 'ADMIN' | 'TEACHER';
  academyName: string;
  teachers: Teacher[];
  classes: Class[];
  academies: Academy[];
  selectedAcademy: string;
  setSelectedAcademy: (v: string) => void;
  selectedClassId: string;
  setSelectedClassId: (v: string) => void;
  selectedTeacherId: string;
  setSelectedTeacherId: (v: string) => void;
  onCreateClass: () => void;
  activePeriodId: string;
  isClassInPeriod: (startDate?: string | null) => boolean;
  viewMode: 'cards' | 'rows';
  onViewModeChange: (mode: 'cards' | 'rows') => void;
}

export function ClassesHeader({
  role, academyName, teachers, classes, academies,
  selectedAcademy, setSelectedAcademy,
  selectedClassId, setSelectedClassId,
  selectedTeacherId, setSelectedTeacherId,
  onCreateClass, activePeriodId, isClassInPeriod,
  viewMode, onViewModeChange,
}: ClassesHeaderProps) {
  // Derive unique teachers from classes (for ADMIN, scoped to selected academy)
  const teacherOptions = useMemo(() => {
    if (role === 'ACADEMY') {
      return teachers.map(t => ({ id: t.id, name: `${t.firstName} ${t.lastName}`.trim() }));
    }
    if (role === 'ADMIN' && selectedAcademy !== 'all') {
      const academyClasses = classes.filter(c => c.academyId === selectedAcademy);
      const seen = new Map<string, string>();
      for (const c of academyClasses) {
        if (c.teacherId && c.teacherName && !seen.has(c.teacherId)) {
          seen.set(c.teacherId, c.teacherName);
        }
      }
      return Array.from(seen.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
    }
    return [];
  }, [role, teachers, classes, selectedAcademy]);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">
            {role === 'TEACHER' ? 'Mis Asignaturas' : 'Asignaturas'}
          </h1>
          {role === 'ACADEMY' && (
            <button
              onClick={onCreateClass}
              disabled={teachers.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              title={teachers.length === 0 ? 'Debes tener al menos un profesor para crear asignaturas' : ''}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Asignatura
            </button>
          )}
        </div>
        {(role === 'ACADEMY' || role === 'TEACHER') && academyName && (
          <p className="text-sm text-gray-500 mt-1">{academyName}</p>
        )}
        {role === 'ADMIN' && (
          <p className="text-sm text-gray-500 mt-1">AKADEMO PLATFORM</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {teacherOptions.length > 1 && (
          <AcademySearchDropdown
            academies={teacherOptions}
            value={selectedTeacherId}
            onChange={setSelectedTeacherId}
            allLabel="Todos los profesores"
            allValue="all"
            placeholder="Buscar profesor..."
            className="w-full sm:w-48"
          />
        )}
        {role === 'ADMIN' && academies.length > 0 && (
          <AcademySearchDropdown
            academies={academies}
            value={selectedAcademy}
            onChange={setSelectedAcademy}
            allLabel="Todas las Academias"
            className="w-full sm:w-56"
          />
        )}
        {(role === 'ACADEMY' || role === 'TEACHER') && classes.length > 1 && (
          <ClassSearchDropdown
            classes={activePeriodId === 'all' ? classes : classes.filter(c => isClassInPeriod(c.startDate))}
            value={selectedClassId}
            onChange={setSelectedClassId}
            allLabel="Todas las asignaturas"
            className="w-full sm:w-56"
          />
        )}
      </div>
    </div>
  );
}