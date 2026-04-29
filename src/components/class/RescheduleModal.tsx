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
  onClose: () => void;
}

export default function RescheduleModal({
  rescheduleDate, rescheduleTime, paymentStatus,
  onDateChange, onTimeChange, onSubmit, onClose,
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
