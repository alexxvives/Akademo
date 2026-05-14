'use client';

import type { LessonFormData } from '../types';

interface PublishOptionsProps {
  formData: LessonFormData;
  setFormData: React.Dispatch<React.SetStateAction<LessonFormData>>;
}

export function PublishOptions({ formData, setFormData }: PublishOptionsProps) {
  const mode = formData.publishMode;

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Publicación</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, publishMode: 'immediate', publishImmediately: true }))}
              className={`flex-1 h-[38px] px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                mode === 'immediate'
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Ahora
              </div>
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, publishMode: 'scheduled', publishImmediately: false }))}
              className={`flex-1 h-[38px] px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                mode === 'scheduled'
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Programar
              </div>
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, publishMode: 'window', publishImmediately: false }))}
              className={`flex-1 h-[38px] px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                mode === 'window'
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
              title="El vídeo solo es accesible entre dos fechas y horas concretas"
            >
              <div className="flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ventana
              </div>
            </button>
          </div>
        </div>

        {/* Scheduled: single date+time */}
        {mode === 'scheduled' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha y Hora</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={formData.releaseDate}
                onChange={e => setFormData(prev => ({ ...prev, releaseDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
              />
              <input
                type="time"
                value={formData.releaseTime}
                onChange={e => setFormData(prev => ({ ...prev, releaseTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      {/* Window mode: from → until */}
      {mode === 'window' && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 space-y-3">
          <p className="text-xs text-orange-700 font-medium">
            El vídeo solo será accesible entre estas dos fechas y horas. Fuera de ese rango aparecerá bloqueado.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-orange-700 mb-1.5">Desde</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={formData.availableFromDate}
                  onChange={e => setFormData(prev => ({ ...prev, availableFromDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm bg-white focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors"
                />
                <input
                  type="time"
                  value={formData.availableFromTime}
                  onChange={e => setFormData(prev => ({ ...prev, availableFromTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm bg-white focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-orange-700 mb-1.5">Hasta</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={formData.availableUntilDate}
                  onChange={e => setFormData(prev => ({ ...prev, availableUntilDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm bg-white focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors"
                />
                <input
                  type="time"
                  value={formData.availableUntilTime}
                  onChange={e => setFormData(prev => ({ ...prev, availableUntilTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm bg-white focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
