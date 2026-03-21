'use client';

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
  onCreateClass: () => void;
  activePeriodId: string;
  isClassInPeriod: (startDate?: string | null) => boolean;
}

export function ClassesHeader({
  role, academyName, teachers, classes, academies,
  selectedAcademy, setSelectedAcademy,
  selectedClassId, setSelectedClassId,
  onCreateClass, activePeriodId, isClassInPeriod,
}: ClassesHeaderProps) {
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
            className="w-full md:w-64"
          />
        )}
        {(role === 'ACADEMY' || role === 'TEACHER') && classes.length > 1 && (
          <ClassSearchDropdown
            classes={activePeriodId === 'all' ? classes : classes.filter(c => isClassInPeriod(c.startDate))}
            value={selectedClassId}
            onChange={setSelectedClassId}
            allLabel="Todas las asignaturas"
            className="w-64"
          />
        )}
      </div>
    </div>
  );
}
