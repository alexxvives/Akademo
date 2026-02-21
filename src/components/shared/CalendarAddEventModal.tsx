'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { ClassSearchDropdown } from '@/components/ui/ClassSearchDropdown';
import { CustomTimePicker } from '@/components/ui/CustomTimePicker';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';

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
  disabled?: boolean; // disables saving (e.g. demo mode)
  editEvent?: { id: string; title: string; type: string; classId?: string; extra?: string; location?: string; startTime?: string };
  onSaved: (event: {
    id: string;
    title: string;
    type: 'physicalClass' | 'scheduledStream';
    eventDate: string;
    notes?: string | null;
    classId?: string | null;
    location?: string | null;
    startTime?: string | null;
  }) => void;
}

function pad(n: number) { return String(n).padStart(2, '0'); }

export function CalendarAddEventModal({ date, classes, onClose, onSaved, editEvent, disabled }: CalendarAddEventModalProps) {
  const defaultDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  // Default time to current time (rounded to nearest 5 min) when creating new event
  const defaultTime = editEvent?.startTime ?? (() => {
    const now = new Date();
    const mins = Math.ceil(now.getMinutes() / 5) * 5;
    const h = mins >= 60 ? now.getHours() + 1 : now.getHours();
    const m = mins >= 60 ? 0 : mins;
    return `${pad(h % 24)}:${pad(m)}`;
  })();
  const [title, setTitle] = useState(editEvent?.title ?? '');
  const [type, setType] = useState<'physicalClass' | 'scheduledStream'>(
    (editEvent?.type === 'physicalClass' || editEvent?.type === 'scheduledStream') ? editEvent.type : 'physicalClass'
  );
  const [eventDate, setEventDate] = useState(defaultDate);
  const [classId, setClassId] = useState(editEvent?.classId ?? '');
  const [location, setLocation] = useState(editEvent?.location ?? '');
  const [startTime, setStartTime] = useState(defaultTime);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditMode = !!editEvent;

  const handleSave = async () => {
    if (!title.trim()) { setError('El título es obligatorio.'); return; }
    setSaving(true);
    setError('');
    try {
      if (isEditMode) {
        const rawId = editEvent!.id.replace('manual-', '');
        const res = await apiClient(`/calendar-events/${rawId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            type,
            eventDate,
            classId: classId || null,
            location: location.trim() || null,
            startTime: startTime || null,
          }),
        });
        const result = await res.json();
        if (result.success) {
          onSaved({ ...result.data, id: editEvent!.id, eventDate: result.data.eventDate });
          onClose();
        } else {
          setError(result.error || 'Error al guardar.');
        }
      } else {
        const res = await apiClient('/calendar-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            type,
            eventDate,
            classId: classId || undefined,
            location: location.trim() || undefined,
            startTime: startTime || undefined,
          }),
        });
        const result = await res.json();
        if (result.success) {
          onSaved(result.data);
          onClose();
        } else {
          setError(result.error || 'Error al guardar.');
        }
      }
    } catch {
      setError('Error de conexión.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 m-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{isEditMode ? 'Editar evento' : 'Añadir evento'}</h3>
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
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Título <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Date & Time — custom pickers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fecha <span className="text-red-400">*</span></label>
              <CustomDatePicker value={eventDate} onChange={setEventDate} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hora</label>
              <CustomTimePicker value={startTime} onChange={setStartTime} />
            </div>
          </div>

          {/* Asignatura — searchable dropdown with uni/carrera grouping */}
          {classes.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Asignatura</label>
              <ClassSearchDropdown
                classes={classes}
                value={classId || 'all'}
                onChange={(v) => setClassId(v === 'all' ? '' : v)}
                allLabel="— Sin asignatura —"
                allValue="all"
                placeholder="Buscar asignatura..."
              />
            </div>
          )}

          {/* Location — only for physicalClass */}
          {type === 'physicalClass' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ubicación</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="p.ej. Aula 3, Campus Norte"
                className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          )}

          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-700 border-2 border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={disabled ? undefined : handleSave}
            disabled={saving || disabled}
            title={disabled ? 'No disponible en modo demo' : undefined}
            className={`flex-1 py-2.5 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-60 ${
              disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {saving ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Crear evento'}
          </button>
        </div>
      </div>
    </div>
  );
}
