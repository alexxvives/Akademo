'use client';

import { useState } from 'react';

interface DocumentSigningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: () => Promise<void>;
  classId: string;
  className: string;
}

export default function DocumentSigningModal({
  isOpen,
  onClose,
  onSign,
  classId,
  className,
}: DocumentSigningModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [pdfLoaded, setPdfLoaded] = useState(false);

  if (!isOpen) return null;

  const handleSign = async () => {
    if (!agreed) {
      alert('Debes leer y aceptar el documento para continuar');
      return;
    }

    setSigning(true);
    try {
      await onSign();
    } catch (error) {
      alert('Error al firmar el documento');
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Documento de Consentimiento</h2>
            <p className="text-sm text-gray-600 mt-1">{className}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden px-6 py-4">
          <div className="w-full h-full bg-gray-50 rounded-xl border-2 border-gray-200 relative">
            {!pdfLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-600">Cargando documento...</p>
                </div>
              </div>
            )}
            <iframe
              src="/legal/consent.pdf"
              className="w-full h-full rounded-xl"
              onLoad={() => setPdfLoaded(true)}
              title="Documento de Consentimiento"
            />
          </div>
        </div>

        {/* Footer - Agreement and Sign */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-start gap-3 mb-4">
            <input
              type="checkbox"
              id="agree-checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="agree-checkbox" className="text-sm text-gray-700 cursor-pointer select-none">
              He leído y acepto los términos del documento de consentimiento. Entiendo que debo cumplir con todas las normas de la clase y que el incumplimiento puede resultar en la suspensión de mi acceso.
            </label>
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSign}
              disabled={!agreed || signing}
              className="px-8 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {signing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Firmando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Firmar Documento
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-3 text-center">
            Nota: También necesitas la aprobación del profesor para acceder al contenido de la clase
          </p>
        </div>
      </div>
    </div>
  );
}
