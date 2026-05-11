'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ShieldAnimationOverlay, DocumentSigningAnimationStyles } from './DocumentSigningStyles';
import { DocumentContent } from './DocumentContent';

interface DocumentSigningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: () => Promise<void>;
  classId: string;
  className: string;
  academyName?: string;
  readOnly?: boolean;
}

export default function DocumentSigningModal({
  isOpen,
  onClose,
  onSign,
  classId: _classId,
  className,
  academyName = 'Academia',
  readOnly = false,
}: DocumentSigningModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [showShieldAnimation, setShowShieldAnimation] = useState(true);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAgreed(false);
      setSigning(false);
      setShowShieldAnimation(!readOnly);
      setHasScrolledToEnd(readOnly);
      // Hide shield animation after 1.5 seconds
      if (!readOnly) {
        const timer = setTimeout(() => setShowShieldAnimation(false), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, readOnly]);

  // Monitor scroll in the document container
  useEffect(() => {
    if (!isOpen) return;

    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      
      // User reached bottom (within 20px threshold)
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        setHasScrolledToEnd(true);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSign = async () => {
    if (!hasScrolledToEnd) {
      alert('Debes leer el documento completo (desplázate hasta el final)');
      return;
    }
    
    if (!agreed) {
      alert('Debes aceptar el compromiso para continuar');
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

  return createPortal(
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm !m-0 p-2 sm:p-6">
      {/* Shield Animation Overlay */}
      {showShieldAnimation && <ShieldAnimationOverlay />}

      {/* Main Modal */}
      <div className={`bg-white rounded-2xl sm:rounded-3xl w-full max-w-5xl max-h-[94dvh] sm:max-h-[96dvh] flex flex-col shadow-2xl transition-all duration-500 p-3 sm:p-6 ${showShieldAnimation ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        {/* Header */}
        <div className="px-3 sm:px-8 py-2 sm:py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white rounded-t-2xl sm:rounded-t-3xl">
          <div className="flex items-center justify-between sm:justify-center gap-2 sm:gap-4">
            <div className="flex-1 text-center min-w-0">
              <h2 className="text-sm sm:text-xl font-bold text-gray-900 leading-tight"><span className="sm:hidden">CONTRATO Y CONFIDENCIALIDAD</span><span className="hidden sm:inline">CONTRATO DE USO Y COMPROMISO DE CONFIDENCIALIDAD</span></h2>
              <p className="text-xs sm:text-base text-gray-600 mt-0.5 sm:mt-1 truncate">
                <span className="font-medium text-brand-600">{className}</span> — {readOnly ? 'Documento ya firmado' : 'Firma requerida para acceder'}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="p-2 sm:p-3 hover:bg-gray-100 rounded-xl transition-colors shrink-0"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Document content - Scrollable */}
        <div 
          ref={containerRef}
          className="flex-1 min-h-0 overflow-y-auto bg-gray-50 rounded-xl sm:rounded-2xl border-2 border-gray-200 relative shadow-inner" 
        >
          <DocumentContent academyName={academyName} />
        </div>

        {/* Footer - Agreement and Sign Button */}
        {!readOnly && (
        <div className="border-t border-gray-200 bg-white rounded-b-2xl sm:rounded-b-3xl">
          {/* Scroll indicator */}
          {!hasScrolledToEnd && (
            <div className="border-2 border-blue-500 rounded-xl p-1.5 sm:p-3 my-1 sm:my-3 flex items-center justify-center gap-2 sm:gap-3">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <p className="text-xs sm:text-sm text-blue-700 font-medium">
                Desplazá hasta el final para continuar
              </p>
            </div>
          )}

          {/* Checkbox Agreement */}
          <label className={`flex items-center gap-2 sm:gap-4 p-2 sm:p-4 bg-white border-2 rounded-xl transition-colors my-1 sm:my-3 ${
            hasScrolledToEnd
              ? 'border-gray-200 hover:border-green-300 cursor-pointer'
              : 'border-gray-200 opacity-50 cursor-not-allowed'
          }`}>
            <div className="flex-shrink-0">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                disabled={!hasScrolledToEnd}
                className="w-6 h-6 accent-green-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:ring-offset-2 cursor-pointer disabled:cursor-not-allowed"
              />
            </div>
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-semibold text-gray-900">
                Me comprometo a no <strong>compartir</strong> ni permitir el <strong>acceso a terceros</strong> a ningún contenido de la plataforma (vídeos, audios, textos, PDFs, imágenes u otro material didáctico). Entiendo y acepto las <strong>penalizaciones económicas</strong> a las que estaría sujeto y no compartiré los enlaces de clases en vivo con personas no inscritas, ni compartiré mi cuenta con otras personas.
              </p>
            </div>
          </label>

          {/* Action Button - Centered */}
          <div className="flex items-center justify-center mb-1 sm:mb-0">
            <button
              onClick={handleSign}
              disabled={!hasScrolledToEnd || !agreed || signing}
              className={`w-full sm:w-auto px-6 sm:px-10 py-2.5 sm:py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 sm:gap-3 shadow-lg text-sm sm:text-base ${
                hasScrolledToEnd && agreed && !signing
                  ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-green-500/30 hover:shadow-green-500/40 hover:scale-[1.02]'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none'
              }`}
            >
              {signing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Firmando...</span>
                </>
              ) : !hasScrolledToEnd ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Lee el Documento Completo</span>
                </>
              ) : (
                <>
                  <span>Firmar y Acceder a la Clase</span>
                </>
              )}
            </button>
          </div>

          {/* Additional Note */}
          <p className="text-[10px] sm:text-xs text-gray-500 mt-2 sm:mt-4 mb-1 text-center px-2">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Tu firma digital queda registrada de forma segura. Este documento también requiere la aprobación del profesor.
          </p>
        </div>
        )}
      </div>

      {/* CSS for animations */}
      <DocumentSigningAnimationStyles />
    </div>,
    document.body
  );
}
