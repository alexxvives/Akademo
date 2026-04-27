'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';

export interface LessonOption {
  id: string;
  title: string;
  topicId?: string | null;
  topicName?: string | null;
}

interface LessonSearchDropdownProps {
  lessons: LessonOption[];
  value: string; // selected lesson ID, or '' for "Sin clase específica"
  onChange: (value: string) => void;
  className?: string;
}

export function LessonSearchDropdown({ lessons, value, onChange, className = '' }: LessonSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
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

  const displayName = useMemo(() => {
    if (!value) return '';
    return lessons.find((l) => l.id === value)?.title ?? '';
  }, [value, lessons]);

  // Filter by search
  const filteredLessons = useMemo(() => {
    if (!search.trim()) return lessons;
    const q = search.toLowerCase();
    return lessons.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        (l.topicName && l.topicName.toLowerCase().includes(q))
    );
  }, [lessons, search]);

  // Group into topics
  const grouped = useMemo(() => {
    const byTopic: Record<string, LessonOption[]> = {};
    const topicOrder: string[] = [];
    const noTopic: LessonOption[] = [];
    for (const l of filteredLessons) {
      if (l.topicName) {
        if (!byTopic[l.topicName]) {
          byTopic[l.topicName] = [];
          topicOrder.push(l.topicName);
        }
        byTopic[l.topicName].push(l);
      } else {
        noTopic.push(l);
      }
    }
    return { byTopic, topicOrder, noTopic };
  }, [filteredLessons]);

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <div
        className={`flex items-center w-full bg-white border border-gray-200 rounded-lg text-sm cursor-pointer ${
          isOpen ? 'ring-2 ring-brand-500 border-transparent' : ''
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
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 outline-none bg-transparent text-gray-900 placeholder-gray-400"
            placeholder="Buscar clase..."
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={`flex-1 px-3 py-2 truncate ${value ? 'text-gray-900' : 'text-gray-400'}`}>
            {displayName || 'Sin clase específica'}
          </span>
        )}
        <svg
          className={`w-4 h-4 mr-3 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown list */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {/* "Sin clase específica" option */}
          <div
            className={`px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm ${
              !value ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-500'
            }`}
            onClick={() => handleSelect('')}
          >
            Sin clase específica
          </div>

          {grouped.topicOrder.length > 0 || grouped.noTopic.length > 0 ? (
            <>
              {grouped.topicOrder.map((topicName) => (
                <div key={topicName}>
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-t border-gray-100">
                    {topicName}
                  </div>
                  {grouped.byTopic[topicName].map((l) => (
                    <div
                      key={l.id}
                      className={`px-5 py-2 cursor-pointer hover:bg-gray-50 text-sm ${
                        value === l.id ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-900'
                      }`}
                      onClick={() => handleSelect(l.id)}
                    >
                      {l.title}
                    </div>
                  ))}
                </div>
              ))}
              {grouped.noTopic.length > 0 && (
                <div>
                  {grouped.topicOrder.length > 0 && (
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-t border-gray-100">
                      Sin tema
                    </div>
                  )}
                  {grouped.noTopic.map((l) => (
                    <div
                      key={l.id}
                      className={`px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm ${
                        grouped.topicOrder.length > 0 ? 'pl-5' : ''
                      } ${value === l.id ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-900'}`}
                      onClick={() => handleSelect(l.id)}
                    >
                      {l.title}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="px-3 py-4 text-sm text-gray-400 text-center">
              {search ? 'Sin resultados' : 'No hay clases'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
