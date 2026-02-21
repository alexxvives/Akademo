'use client';

import { useState, useRef, useEffect } from 'react';

interface Academy {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
  teacherName?: string;
}

interface StudentTeacherFieldsProps {
  role: 'STUDENT' | 'TEACHER';
  fullName: string;
  academyId: string;
  classId: string;
  classIds: string[];
  academies: Academy[];
  classes: Class[];
  loadingAcademies: boolean;
  loadingClasses: boolean;
  onFullNameChange: (name: string) => void;
  onAcademyChange: (id: string) => void;
  onClassChange: (id: string) => void;
  onClassIdsChange: (ids: string[]) => void;
}

/* ── Custom styled dropdown (replaces native <select>) ── */
function FormSelect({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  loading,
  emptyMessage,
}: {
  options: { id: string; label: string; sublabel?: string }[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
  emptyMessage?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.id === value);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-lg text-sm transition-all bg-white ${
          isOpen ? 'ring-2 ring-brand-500 border-brand-500' : 'border-gray-200 hover:border-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {loading ? 'Cargando...' : selected?.label || placeholder}
        </span>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
          {loading ? (
            <div className="px-3 py-3 text-sm text-gray-400 text-center">Cargando...</div>
          ) : options.length === 0 ? (
            <div className="px-3 py-3 text-sm text-gray-400 text-center">{emptyMessage || 'Sin opciones disponibles'}</div>
          ) : (
            options.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => { onChange(opt.id); setIsOpen(false); }}
                className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                  value === opt.id
                    ? 'bg-brand-50 text-brand-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {opt.label}
                {opt.sublabel && (
                  <span className="text-gray-400 ml-1 text-xs">({opt.sublabel})</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function StudentTeacherFields({ 
  role, fullName, academyId, classId, classIds,
  academies, classes, loadingAcademies, loadingClasses,
  onFullNameChange, onAcademyChange, onClassChange, onClassIdsChange
}: StudentTeacherFieldsProps) {
  const academyOptions = academies.map(a => ({ id: a.id, label: a.name }));
  const classOptions = classes.map(c => ({
    id: c.id,
    label: c.name,
    sublabel: c.teacherName || undefined,
  }));

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre Completo</label>
        <input
          type="text"
          required
          autoComplete="name"
          value={fullName}
          onChange={(e) => onFullNameChange(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm transition-all"
          placeholder="Juan Pérez"
        />
      </div>

      {/* Academy Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Academia {academies.length > 0 && <span className="text-gray-500">({academies.length} disponibles)</span>}
        </label>
        <FormSelect
          options={academyOptions}
          value={academyId}
          onChange={onAcademyChange}
          placeholder="Selecciona una academia"
          disabled={loadingAcademies}
          loading={loadingAcademies}
          emptyMessage="No hay academias disponibles"
        />
        {!loadingAcademies && academies.length === 0 && (
          <p className="text-xs text-red-500 mt-1">No hay academias disponibles. Por favor contacta al administrador.</p>
        )}
      </div>

      {/* Student: Single Class Selection */}
      {role === 'STUDENT' && academyId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Clase {classes.length > 0 && <span className="text-gray-500">({classes.length} disponibles)</span>}
          </label>
          <FormSelect
            options={classOptions}
            value={classId}
            onChange={onClassChange}
            placeholder="Selecciona una clase"
            disabled={loadingClasses}
            loading={loadingClasses}
            emptyMessage="No hay clases disponibles"
          />
          {!loadingClasses && academyId && classes.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">Necesitarás aprobación del profesor</p>
          )}
        </div>
      )}

      {/* Teacher: Multi-select Classes */}
      {role === 'TEACHER' && academyId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Clases a enseñar</label>
          <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto bg-white">
            {loadingClasses ? (
              <p className="text-xs text-gray-500">Cargando clases...</p>
            ) : classes.length === 0 ? (
              <p className="text-xs text-gray-500">No hay clases disponibles</p>
            ) : (
              classes.map(cls => (
                <label key={cls.id} className="flex items-center gap-2 py-1.5 hover:bg-gray-50 rounded px-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={classIds.includes(cls.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onClassIdsChange([...classIds, cls.id]);
                      } else {
                        onClassIdsChange(classIds.filter(id => id !== cls.id));
                      }
                    }}
                    className="rounded text-brand-600 focus:ring-2 focus:ring-brand-500"
                  />
                  <span className="text-sm text-gray-700">{cls.name}</span>
                </label>
              ))
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">Selecciona al menos una. Necesitarás aprobación de la academia.</p>
        </div>
      )}
    </>
  );
}
