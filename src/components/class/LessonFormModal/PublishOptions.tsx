'use client';

import type { LessonFormData } from '../types';

interface PublishOptionsProps {
  formData: LessonFormData;
  setFormData: React.Dispatch<React.SetStateAction<LessonFormData>>;
}

export function PublishOptions({ formData, setFormData }: PublishOptionsProps) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Publicación</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, publishImmediately: true }))}
            className={`flex-1 h-[38px] px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
              formData.publishImmediately
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
            onClick={() => setFormData(prev => ({ ...prev, publishImmediately: false }))}
            className={`flex-1 h-[38px] px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
              !formData.publishImmediately
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
        </div>
      </div>
      {!formData.publishImmediately && (
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
  );
}
