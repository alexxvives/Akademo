'use client';

import { AcademySearchDropdown } from '@/components/ui/AcademySearchDropdown';
import { ClassSearchDropdown } from '@/components/ui/ClassSearchDropdown';
import type { PagosState } from './usePagosData';

interface PagosFiltersProps {
  state: PagosState;
}

export function PagosFilters({ state }: PagosFiltersProps) {
  const {
    isAdmin, isAcademy, academyName, academies, selectedAcademy,
    setSelectedAcademy, searchQuery, setSearchQuery, classes,
    selectedClass, setSelectedClass, setLoading, activePeriodId,
    isClassInPeriod, setEditingPaymentId, setRegisterForm,
    setStudentSearchTerm, setShowRegisterModal,
  } = state;

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">Gestión de Pagos</h1>
          {isAcademy && (
            <button
              onClick={() => {
                setEditingPaymentId(null);
                setRegisterForm({ studentId: '', classId: '', amount: '', paymentMethod: 'cash', status: 'PAID' });
                setStudentSearchTerm('');
                setShowRegisterModal(true);
              }}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Registrar Pago
            </button>
          )}
        </div>
        <p className="text-gray-600 text-sm mt-1">
          {isAdmin ? 'AKADEMO PLATFORM' : (academyName || 'Cargando...')}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {isAdmin && (
          <AcademySearchDropdown
            academies={academies}
            value={selectedAcademy}
            onChange={(value) => {
              setSelectedAcademy(value);
              setLoading(true);
            }}
            allLabel="Todas las academias"
            allValue="all"
            className="w-full sm:w-48"
          />
        )}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar estudiante..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-48 pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <ClassSearchDropdown
          classes={activePeriodId === 'all' || isAdmin ? classes : classes.filter(c => !c.startDate || isClassInPeriod(c.startDate))}
          value={selectedClass}
          onChange={setSelectedClass}
          allLabel="Todas las asignaturas"
          className="w-full sm:w-56"
        />
      </div>
    </div>
  );
}
