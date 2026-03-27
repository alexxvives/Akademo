'use client';

import React from 'react';
import { AcademySearchDropdown } from '@/components/ui/AcademySearchDropdown';
import type { Academy } from './types';

interface TeachersHeaderProps {
  role: 'ACADEMY' | 'ADMIN';
  academyName: string;
  academies: Academy[];
  selectedAcademy: string;
  onSelectAcademy: (value: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onCreateClick: () => void;
  onMigrationClick?: () => void;
}

export function TeachersHeader({
  role, academyName, academies, selectedAcademy,
  onSelectAcademy, searchQuery, onSearchChange, onCreateClick, onMigrationClick,
}: TeachersHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">Profesores</h1>
          {(role === 'ACADEMY' || role === 'ADMIN') && (
            <button
              onClick={onCreateClick}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Crear Profesor
            </button>
          )}
          {role === 'ACADEMY' && onMigrationClick && (
            <button
              onClick={onMigrationClick}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Migración CSV
            </button>
          )}
        </div>
        {academyName && <p className="text-sm text-gray-500 mt-1">{academyName}</p>}
        {!academyName && role === 'ADMIN' && <p className="text-sm text-gray-500 mt-1">AKADEMO PLATFORM</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar profesor..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full sm:w-48 pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {role === 'ADMIN' && academies.length > 0 && (
          <AcademySearchDropdown
            academies={academies}
            value={selectedAcademy}
            onChange={onSelectAcademy}
            allLabel="Todas las Academias"
            allValue="ALL"
            className="w-full sm:w-56"
          />
        )}
      </div>
    </div>
  );
}
