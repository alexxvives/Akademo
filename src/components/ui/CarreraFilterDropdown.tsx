'use client';

import { useState, useRef, useEffect, useMemo } from 'react';

const SEP = '|||';

export function buildFilterGroups(
  items: Array<{ university?: string | null; carrera?: string | null }>
): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const item of items) {
    if (!item.university && !item.carrera) continue;
    const uni = item.university ?? 'Universidad no asignada';
    const car = item.carrera ?? 'Carrera no asignada';
    if (!groups[uni]) groups[uni] = [];
    if (!groups[uni].includes(car)) groups[uni].push(car);
  }
  return groups;
}

export function matchesFilter<T extends { university?: string | null; carrera?: string | null }>(
  item: T,
  filterKey: string
): boolean {
  if (!filterKey) return true;
  const [uni, car] = filterKey.split(SEP);
  return (
    (item.university ?? 'Universidad no asignada') === uni &&
    (item.carrera ?? 'Carrera no asignada') === car
  );
}

interface CarreraFilterDropdownProps {
  groups: Record<string, string[]>;
  value: string;
  onChange: (v: string) => void;
}

export function CarreraFilterDropdown({ groups, value, onChange }: CarreraFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const displayLabel = useMemo(() => {
    if (!value) return null;
    return value.split(SEP)[1];
  }, [value]);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
    const q = search.toLowerCase();
    const result: Record<string, string[]> = {};
    for (const [uni, carreras] of Object.entries(groups)) {
      const matched = carreras.filter(
        car => car.toLowerCase().includes(q) || uni.toLowerCase().includes(q)
      );
      if (matched.length > 0) result[uni] = matched;
    }
    return result;
  }, [groups, search]);

  const hasResults = Object.values(filteredGroups).some(c => c.length > 0);

  const handleSelect = (key: string) => {
    onChange(key);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative w-full sm:w-72">
      <div
        className={`flex items-center w-full bg-white border rounded-lg text-sm cursor-pointer ${
          isOpen ? 'ring-2 ring-gray-300 border-transparent' : 'border-gray-200'
        }`}
        onClick={() => {
          setIsOpen(true);
          setSearch('');
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        {isOpen ? (
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar carrera o universidad..."
            className="w-full pl-3 pr-8 py-2 bg-transparent text-sm text-gray-700 outline-none rounded-lg"
            onKeyDown={e => {
              if (e.key === 'Escape') { setIsOpen(false); setSearch(''); }
            }}
          />
        ) : (
          <span className={`block w-full pl-3 pr-8 py-2 truncate ${displayLabel ? 'text-gray-700' : 'text-gray-400'}`}>
            {displayLabel ?? 'Filtrar por carrera'}
          </span>
        )}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-[20rem] overflow-y-auto">
          <button
            type="button"
            onClick={() => handleSelect('')}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
              !value ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-500'
            }`}
          >
            Todas las carreras
          </button>
          {Object.entries(filteredGroups)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([uni, carreras]) => (
              <div key={uni}>
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 uppercase tracking-wide border-t border-gray-100">
                  {uni}
                </div>
                {[...carreras].sort((a, b) => a.localeCompare(b)).map(car => (
                  <button
                    key={`${uni}${SEP}${car}`}
                    type="button"
                    onClick={() => handleSelect(`${uni}${SEP}${car}`)}
                    className={`w-full text-left px-3 py-1.5 pl-6 text-sm hover:bg-gray-50 ${
                      value === `${uni}${SEP}${car}` ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {car}
                  </button>
                ))}
              </div>
            ))}
          {!hasResults && (
            <div className="px-3 py-3 text-sm text-gray-400 text-center">
              No se encontraron resultados
            </div>
          )}
        </div>
      )}
    </div>
  );
}
