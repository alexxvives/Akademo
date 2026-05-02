'use client';

import type { LessonFormData } from '../types';

interface StreamRecordingSelectorProps {
  formData: LessonFormData;
  setFormData: React.Dispatch<React.SetStateAction<LessonFormData>>;
  availableStreamRecordings: Array<{ id: string; title: string; createdAt: string }>;
  compact?: boolean;
}

export function StreamRecordingSelector({
  formData,
  setFormData,
  availableStreamRecordings,
  compact,
}: StreamRecordingSelectorProps) {
  return (
    <div className="relative">
      <label className={`block ${compact ? 'text-xs font-medium text-gray-600' : 'text-sm font-medium text-gray-700'} mb-1.5`}>Grabación de stream</label>
      <details className="w-full border border-gray-200 rounded-lg text-sm bg-white">
        <summary className="px-3 py-2 cursor-pointer hover:bg-gray-50 rounded-lg flex items-center justify-between">
          <span>
            {formData.selectedStreamRecordings.length > 0
              ? `${formData.selectedStreamRecordings.length} grabaciones seleccionadas`
              : availableStreamRecordings.length === 0
                ? 'No hay grabaciones disponibles'
                : 'Seleccionar grabaciones'}
          </span>
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="absolute left-0 right-0 mt-1 px-3 py-2 max-h-[200px] overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-lg z-50">
          {availableStreamRecordings.length === 0 ? (
            <p className="text-gray-500 text-sm py-1">No hay grabaciones disponibles</p>
          ) : (
            <div className="space-y-2">
              {availableStreamRecordings.map(recording => (
                <label key={recording.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={formData.selectedStreamRecordings.includes(recording.id)}
                    onChange={e => {
                      const checked = e.target.checked;
                      setFormData(prev => ({
                        ...prev,
                        selectedStreamRecordings: checked
                          ? [...prev.selectedStreamRecordings, recording.id]
                          : prev.selectedStreamRecordings.filter(id => id !== recording.id)
                      }));
                    }}
                    className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                  />
                  <span className="text-sm text-gray-700 flex-1">
                    {recording.title} ({new Date(recording.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })})
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
