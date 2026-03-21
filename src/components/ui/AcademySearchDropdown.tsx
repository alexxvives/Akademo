'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';

interface AcademyOption {
  id: string;
  name: string;
}

interface AcademySearchDropdownProps {
  academies: AcademyOption[];
  value: string;
  onChange: (value: string) => void;
  allLabel?: string;
  allValue?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function AcademySearchDropdown({
  academies,
  value,
  onChange,
  allLabel,
  allValue = 'all',
  placeholder = 'Buscar academia...',
  className = '',
  disabled = false,
}: AcademySearchDropdownProps) {
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
    const academy = academies.find((a) => a.id === value);
    return academy?.name || '';
  }, [value, academies, allLabel, allValue]);

  // Filter academies by search and sort alphabetically
  const filtered = useMemo(() => {
    let result = academies;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = academies.filter((a) => a.name.toLowerCase().includes(q));
    }
    return [...result].sort((a, b) => a.name.localeCompare(b.name));
  }, [academies, search]);

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Display field / search input */}
      <div
        className={`flex items-center w-full bg-white border border-gray-200 rounded-lg text-sm cursor-pointer ${
          disabled ? 'opacity-50 pointer-events-none' : ''
        } ${isOpen ? 'ring-2 ring-brand-500 border-transparent' : ''}`}
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            setSearch('');
            setTimeout(() => { inputRef.current?.focus(); }, 0);
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
              if (e.key === 'Escape') { setIsOpen(false); setSearch(''); }
            }}
          />
        ) : (
          <span className={`block w-full pl-3 pr-8 py-2 truncate ${value === allValue && allLabel ? 'text-gray-500' : 'text-gray-700'}`}>
            {displayName || <span className="text-gray-400">{placeholder}</span>}
          </span>
        )}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Dropdown menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {/* All option */}
          {allLabel && (
            <button
              type="button"
              onClick={() => handleSelect(allValue)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                value === allValue ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700'
              }`}
            >
              {allLabel}
            </button>
          )}

          {/* Academy options */}
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              No se encontraron academias
            </div>
          ) : (
            filtered.map((academy) => (
              <button
                key={academy.id}
                type="button"
                onClick={() => handleSelect(academy.id)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                  value === academy.id ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700'
                }`}
              >
                {academy.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
