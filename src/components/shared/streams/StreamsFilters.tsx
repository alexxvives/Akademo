import { ClassSearchDropdown } from '@/components/ui/ClassSearchDropdown';
import { AcademySearchDropdown } from '@/components/ui/AcademySearchDropdown';
import type { Academy, ClassOption } from './types';

interface StreamsFiltersProps {
  role: 'ACADEMY' | 'ADMIN' | 'TEACHER';
  academyName: string;
  isAcademy: boolean;
  isTeacher: boolean;
  isAdmin: boolean;
  classes: ClassOption[];
  academies: Academy[];
  selectedClass: string;
  setSelectedClass: (value: string) => void;
  selectedAcademy: string;
  setSelectedAcademy: (value: string) => void;
  filteredClassOptions: ClassOption[];
  activePeriodId: string;
  isClassInPeriod: (startDate?: string) => boolean;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
}

export function StreamsFilters({
  role, academyName, isAcademy, isTeacher, isAdmin,
  classes, academies, selectedClass, setSelectedClass,
  selectedAcademy, setSelectedAcademy, filteredClassOptions,
  activePeriodId, isClassInPeriod,
  searchQuery, setSearchQuery,
}: StreamsFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Historial de Streams</h1>
        {(isAcademy || isTeacher) && academyName && (
          <p className="text-gray-600 text-sm mt-1">{academyName}</p>
        )}
        {isAdmin && (
          <p className="text-gray-600 text-sm mt-1">Todas las academias</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative w-full sm:w-56">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar stream..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {(isAcademy || isTeacher) && classes.length > 0 && (
          <ClassSearchDropdown
            classes={activePeriodId === 'all' ? classes : classes.filter(c => isClassInPeriod(c.startDate))}
            value={selectedClass}
            onChange={setSelectedClass}
            allLabel="Todas las asignaturas"
            className="w-full sm:w-56"
          />
        )}

        {role === 'ADMIN' && selectedAcademy !== 'all' && filteredClassOptions.length > 0 && (
          <ClassSearchDropdown
            classes={filteredClassOptions}
            value={selectedClass}
            onChange={setSelectedClass}
            allLabel="Todas las asignaturas"
            className="w-full sm:w-56"
          />
        )}

        {role === 'ADMIN' && (
          <AcademySearchDropdown
            academies={academies}
            value={selectedAcademy}
            onChange={(newVal) => {
              setSelectedAcademy(newVal);
              setSelectedClass('all');
            }}
            allLabel="Todas las academias"
            className="w-full sm:w-56"
          />
        )}
      </div>
    </div>
  );
}
