'use client';

import { ModalPortal } from '@/components/ui/ModalPortal';

interface StreamNameModalProps {
  streamNameInput: string;
  paymentStatus: string;
  onInputChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export default function StreamNameModal({
  streamNameInput, paymentStatus,
  onInputChange, onConfirm, onClose,
}: StreamNameModalProps) {
  return (
    <ModalPortal>
      <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 flex items-center justify-center z-[9999] overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl m-4">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Nombre del Stream</h3>
          <input
            type="text"
            value={streamNameInput}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Ingrese el nombre del stream"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 mb-4"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') onConfirm();
              else if (e.key === 'Escape') onClose();
            }}
          />
          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              disabled={!streamNameInput.trim() || paymentStatus === 'NOT PAID'}
              className="flex-1 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title={paymentStatus === 'NOT PAID' ? 'No disponible en modo demo' : undefined}
            >
              Crear Stream
            </button>
            <button
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
