'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';

interface ClassOption {
  id: string;
  name: string;
  university?: string | null;
  carrera?: string | null;
}

interface ClassSearchDropdownProps {
  classes: ClassOption[];
  value: string;
  onChange: (value: string) => void;
  allLabel?: string; // If provided, shows an "all" option with this label
  allValue?: string; // Value for "all" (default: "all")
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export function ClassSearchDropdown({
  classes,
  value,
  onChange,
  allLabel,
  allValue = 'all',
  placeholder = 'Buscar asignatura...',
  className = '',
  disabled = false,
  required = false,
}: ClassSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Get display name for current value
  const displayName = useMemo(() => {
    if (allLabel && value === allValue) return allLabel;
    const cls = classes.find((c) => c.id === value);
    return cls?.name || '';
  }, [value, classes, allLabel, allValue]);

  // Filter classes by search and sort alphabetically
  const filtered = useMemo(() => {
    let result = classes;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = classes.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.university && c.university.toLowerCase().includes(q)) ||
          (c.carrera && c.carrera.toLowerCase().includes(q))
      );
    }
    return [...result].sort((a, b) => a.name.localeCompare(b.name));
  }, [classes, search]);

  // Group by university → carrera
  const grouped = useMemo(() => {
    const hasGroups = classes.some((c) => c.university || c.carrera);
    if (!hasGroups) return null; // No grouping needed

    const groups: Record<string, Record<string, ClassOption[]>> = {};

    for (const cls of filtered) {
      const uniKey = cls.university || 'Universidad no asignada';
      const carKey = cls.carrera || 'Carrera no asignada';
      if (!groups[uniKey]) groups[uniKey] = {};
      if (!groups[uniKey][carKey]) groups[uniKey][carKey] = [];
      groups[uniKey][carKey].push(cls);
    }

    return { groups };
  }, [filtered, classes]);

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Display button / input */}
      <div
        className={`flex items-center w-full bg-white border border-gray-200 rounded-lg text-sm cursor-pointer ${
          disabled ? 'opacity-50 pointer-events-none' : ''
        } ${isOpen ? 'ring-2 ring-brand-500 border-transparent' : ''}`}
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            setSearch('');
            setTimeout(() => {
              inputRef.current?.focus();
            }, 0);
          }
        }}
      >
        {isOpen ? (
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-3 pr-8 py-2 bg-transparent text-sm text-gray-700 outline-none rounded-lg"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsOpen(false);
                setSearch('');
              }
            }}
          />
        ) : (
          <span className={`block w-full pl-3 pr-8 py-2 truncate ${value === allValue && allLabel ? 'text-gray-500' : 'text-gray-700'}`}>
            {displayName || <span className="text-gray-400">{placeholder}</span>}
          </span>
        )}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? 'M19 9l-7 7-7-7' : 'M19 9l-7 7-7-7'} />
          </svg>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {/* "All" option */}
          {allLabel && (
            <button
              type="button"
              onClick={() => handleSelect(allValue)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                value === allValue ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600'
              }`}
            >
              {allLabel}
            </button>
          )}

          {/* Grouped rendering */}
          {grouped ? (
            <>
              {Object.entries(grouped.groups)
                .sort(([a], [b]) => {
                  // "Universidad no asignada" always last
                  if (a === 'Universidad no asignada') return 1;
                  if (b === 'Universidad no asignada') return -1;
                  return a.localeCompare(b);
                })
                .map(([uni, carreras]) => (
                  <div key={uni}>
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 uppercase tracking-wide border-t border-gray-100">
                      {uni}
                    </div>
                    {Object.entries(carreras)
                      .sort(([a], [b]) => {
                        // "Carrera no asignada" always last within university
                        if (a === 'Carrera no asignada') return 1;
                        if (b === 'Carrera no asignada') return -1;
                        return a.localeCompare(b);
                      })
                      .map(([car, items]) => (
                        <div key={`${uni}-${car}`}>
                          <div className="px-3 py-1 text-xs font-medium text-gray-400 pl-5">
                            {car}
                          </div>
                          {items
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((cls) => (
                            <button
                              key={cls.id}
                              type="button"
                              onClick={() => handleSelect(cls.id)}
                              className={`w-full text-left px-3 py-1.5 pl-8 text-sm hover:bg-gray-50 ${
                                value === cls.id ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700'
                              }`}
                            >
                              {cls.name}
                            </button>
                          ))}
                        </div>
                      ))}
                  </div>
                ))}
            </>
          ) : (
            /* Flat rendering (no university/carrera data) */
            filtered.map((cls) => (
              <button
                key={cls.id}
                type="button"
                onClick={() => handleSelect(cls.id)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                  value === cls.id ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700'
                }`}
              >
                {cls.name}
              </button>
            ))
          )}

          {filtered.length === 0 && (
            <div className="px-3 py-3 text-sm text-gray-400 text-center">
              No se encontraron asignaturas
            </div>
          )}
        </div>
      )}

      {/* Hidden input for form validation */}
      {required && <input type="hidden" value={value} required />}
    </div>
  );
}
