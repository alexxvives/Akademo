'use client';

import { ModalPortal } from '@/components/ui/ModalPortal';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';
import { CustomTimePicker } from '@/components/ui/CustomTimePicker';

interface RescheduleModalProps {
  rescheduleDate: string;
  rescheduleTime: string;
  paymentStatus: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onSubmit: (date: string, time: string) => void;
  onHide: () => void;
  onClose: () => void;
}

export default function RescheduleModal({
  rescheduleDate, rescheduleTime, paymentStatus,
  onDateChange, onTimeChange, onSubmit, onHide, onClose,
}: RescheduleModalProps) {
  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Reprogramar Clase</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nueva Fecha</label>
              <CustomDatePicker value={rescheduleDate} onChange={onDateChange} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nueva Hora</label>
              <CustomTimePicker value={rescheduleTime} onChange={onTimeChange} />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={paymentStatus === 'NOT PAID' || !rescheduleDate}
              onClick={() => rescheduleDate && rescheduleTime && onSubmit(rescheduleDate, rescheduleTime)}
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title={paymentStatus === 'NOT PAID' ? 'No disponible en modo demo' : undefined}
            >
              Reprogramar
            </button>
            <button
              type="button"
              disabled={paymentStatus === 'NOT PAID'}
              onClick={onHide}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              title={paymentStatus === 'NOT PAID' ? 'No disponible en modo demo' : 'Ocultar para siempre'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
              Ocultar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg font-medium text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
