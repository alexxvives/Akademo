'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface CustomTimePickerProps {
  value: string; // "HH:MM"
  onChange: (value: string) => void;
  className?: string;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function CustomTimePicker({ value, onChange, className }: CustomTimePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hourColRef = useRef<HTMLDivElement>(null);
  const minColRef = useRef<HTMLDivElement>(null);

  const [selHour, selMin] = (value || '00:00').split(':').map(Number);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Scroll to selected values when opening
  const scrollToSelected = useCallback(() => {
    requestAnimationFrame(() => {
      if (hourColRef.current) {
        const el = hourColRef.current.querySelector('[data-selected="true"]') as HTMLElement;
        if (el) el.scrollIntoView({ block: 'center', behavior: 'instant' });
      }
      if (minColRef.current) {
        const el = minColRef.current.querySelector('[data-selected="true"]') as HTMLElement;
        if (el) el.scrollIntoView({ block: 'center', behavior: 'instant' });
      }
    });
  }, []);

  const handleOpen = () => {
    setOpen(true);
    scrollToSelected();
  };

  const pick = (h: number, m: number) => {
    onChange(`${pad(h)}:${pad(m)}`);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  // Display formatted time
  const displayTime = value
    ? `${pad(selHour)}:${pad(selMin)}`
    : '—:—';

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl hover:border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white transition-colors"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>{displayTime}</span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden w-full min-w-[180px]">
          <div className="flex divide-x divide-gray-100" style={{ height: '200px' }}>
            {/* Hours column */}
            <div ref={hourColRef} className="flex-1 overflow-y-auto scrollbar-thin">
              <div className="sticky top-0 bg-gray-50 px-2 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center border-b border-gray-100">
                Hora
              </div>
              {hours.map((h) => (
                <button
                  key={h}
                  type="button"
                  data-selected={h === selHour}
                  onClick={() => { pick(h, selMin); }}
                  className={`w-full px-3 py-1.5 text-sm text-center transition-colors ${
                    h === selHour
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pad(h)}
                </button>
              ))}
            </div>
            {/* Minutes column */}
            <div ref={minColRef} className="flex-1 overflow-y-auto scrollbar-thin">
              <div className="sticky top-0 bg-gray-50 px-2 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center border-b border-gray-100">
                Min
              </div>
              {minutes.map((m) => (
                <button
                  key={m}
                  type="button"
                  data-selected={m === selMin}
                  onClick={() => { pick(selHour, m); }}
                  className={`w-full px-3 py-1.5 text-sm text-center transition-colors ${
                    m === selMin
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pad(m)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
