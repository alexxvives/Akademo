'use client';

import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { CustomTimePicker } from '@/components/ui/CustomTimePicker';
import { DateRangePicker } from './DateRangePicker';
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
                mode === 'immediate' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
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
                mode === 'scheduled' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
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
                mode === 'window' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
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

        {/* Programar: custom date + time pickers */}
        {mode === 'scheduled' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha y Hora</label>
            <div className="grid grid-cols-2 gap-2">
              <CustomDatePicker
                value={formData.releaseDate}
                onChange={v => setFormData(prev => ({ ...prev, releaseDate: v }))}
              />
              <CustomTimePicker
                value={formData.releaseTime}
                onChange={v => setFormData(prev => ({ ...prev, releaseTime: v }))}
              />
            </div>
          </div>
        )}
      </div>

      {/* Ventana: range date+time picker */}
      {mode === 'window' && (
        <DateRangePicker
          fromDate={formData.availableFromDate}
          fromTime={formData.availableFromTime}
          untilDate={formData.availableUntilDate}
          untilTime={formData.availableUntilTime}
          onFromDateChange={v => setFormData(prev => ({ ...prev, availableFromDate: v }))}
          onFromTimeChange={v => setFormData(prev => ({ ...prev, availableFromTime: v }))}
          onUntilDateChange={v => setFormData(prev => ({ ...prev, availableUntilDate: v }))}
          onUntilTimeChange={v => setFormData(prev => ({ ...prev, availableUntilTime: v }))}
        />
      )}
    </div>
  );
}

