'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface ClassOption {
  id: string;
  name: string;
  university?: string | null;
  carrera?: string | null;
}

interface CalendarAddEventModalProps {
  date: Date;
  classes: ClassOption[];
  onClose: () => void;
  onSaved: (event: {
    id: string;
    title: string;
    type: 'physicalClass' | 'scheduledStream';
    eventDate: string;
    notes?: string | null;
    classId?: string | null;
    location?: string | null;
  }) => void;
}

function pad(n: number) { return String(n).padStart(2, '0'); }

// ─── Inline searchable dropdown for Asignatura ───
function AsignaturaDropdown({
  classes,
  value,
  onChange,
}: {
  classes: ClassOption[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayName = useMemo(() => {
    if (!value) return '';
    return classes.find((c) => c.id === value)?.name ?? '';
  }, [value, classes]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return classes.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.university && c.university.toLowerCase().includes(q)) ||
        (c.carrera && c.carrera.toLowerCase().includes(q))
    );
  }, [classes, search]);

  // Group by university → carrera
  const grouped = useMemo(() => {
    const hasGroups = classes.some((c) => c.university || c.carrera);
    if (!hasGroups) return null;
    const groups: Record<string, Record<string, ClassOption[]>> = {};
    for (const cls of filtered) {
      const uni = cls.university || 'Sin universidad';
      const car = cls.carrera || 'Sin carrera';
      if (!groups[uni]) groups[uni] = {};
      if (!groups[uni][car]) groups[uni][car] = [];
      groups[uni][car].push(cls);
    }
    return groups;
  }, [filtered, classes]);

  const handleOpen = () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const select = (id: string) => {
    onChange(id);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-left"
      >
        <span className={displayName ? 'text-gray-900' : 'text-gray-400'}>
          {displayName || '— Sin asignatura —'}
        </span>
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar asignatura..."
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            <button
              type="button"
              onClick={() => select('')}
              className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-50"
            >
              — Sin asignatura —
            </button>
            {grouped
              ? Object.entries(grouped).map(([uni, carreras]) =>
                  Object.entries(carreras).map(([car, items]) => (
                    <div key={`${uni}-${car}`}>
                      <div className="px-3 pt-2 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide bg-gray-50">
                        {uni !== 'Sin universidad' ? `${uni} · ${car}` : car}
                      </div>
                      {items.map((cls) => (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => select(cls.id)}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-brand-50 hover:text-brand-700 ${value === cls.id ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700'}`}
                        >
                          {cls.name}
                        </button>
                      ))}
                    </div>
                  ))
                )
              : filtered.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => select(cls.id)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-brand-50 hover:text-brand-700 ${value === cls.id ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700'}`}
                  >
                    {cls.name}
                  </button>
                ))}
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-sm text-gray-400 text-center">Sin resultados</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function CalendarAddEventModal({ date, classes, onClose, onSaved }: CalendarAddEventModalProps) {
  const defaultDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'physicalClass' | 'scheduledStream'>('physicalClass');
  const [eventDate, setEventDate] = useState(defaultDate);
  const [classId, setClassId] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!title.trim()) { setError('El título es obligatorio.'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await apiClient('/calendar-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          type,
          eventDate,
          classId: classId || undefined,
          location: location.trim() || undefined,
        }),
      });
      const result = await res.json();
      if (result.success) {
        onSaved(result.data);
        onClose();
      } else {
        setError(result.error || 'Error al guardar.');
      }
    } catch {
      setError('Error de conexión.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ isolation: 'isolate' }}>
      {/* Full-screen backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Añadir evento</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Type toggle */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
            {(['physicalClass', 'scheduledStream'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  type === t
                    ? t === 'physicalClass'
                      ? 'bg-white text-violet-700 shadow-sm'
                      : 'bg-white text-red-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'physicalClass' ? 'Clase presencial' : 'Stream programado'}
              </button>
            ))}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Título <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Date — full row clickable */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha <span className="text-red-400">*</span></label>
            <div
              className="relative cursor-pointer"
              onClick={() => dateInputRef.current?.showPicker?.()}
            >
              <input
                ref={dateInputRef}
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Asignatura — searchable dropdown */}
          {classes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Asignatura</label>
              <AsignaturaDropdown classes={classes} value={classId} onChange={setClassId} />
            </div>
          )}

          {/* Location — only for physicalClass */}
          {type === 'physicalClass' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ubicación</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="p.ej. Aula 3, Campus Norte"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}

          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
