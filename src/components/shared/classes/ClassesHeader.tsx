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
}

export function ClassesHeader({
  role, academyName, teachers, classes, academies,
  selectedAcademy, setSelectedAcademy,
  selectedClassId, setSelectedClassId,
  selectedTeacherId, setSelectedTeacherId,
  onCreateClass, activePeriodId, isClassInPeriod,
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
        {role === 'ADMIN' && academies.length > 0 && (
          <AcademySearchDropdown
            academies={academies}
            value={selectedAcademy}
            onChange={setSelectedAcademy}
            allLabel="Todas las Academias"
            className="w-full sm:w-56"
          />
        )}
        {teacherOptions.length > 1 && (
          <select
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className="h-10 pl-3 pr-8 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent w-full sm:w-48 appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem' }}
          >
            <option value="all">Todos los profesores</option>
            {teacherOptions.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
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