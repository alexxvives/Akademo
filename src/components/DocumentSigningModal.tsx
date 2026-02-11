'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

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
  classId: _classId,
  className,
}: DocumentSigningModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [showShieldAnimation, setShowShieldAnimation] = useState(true);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAgreed(false);
      setSigning(false);
      setPdfLoaded(false);
      setShowShieldAnimation(true);
      setHasScrolledToEnd(false);
      // Hide shield animation after 1.5 seconds
      const timer = setTimeout(() => setShowShieldAnimation(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Monitor scroll in the PDF container
  useEffect(() => {
    if (!isOpen || !pdfLoaded) return;

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
  }, [isOpen, pdfLoaded]);

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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm !m-0 p-6">
      {/* Shield Animation Overlay */}
      {showShieldAnimation && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-gradient-to-b from-brand-900/90 to-gray-900/90" style={{ animation: 'fadeOut 1.5s ease-in-out forwards' }}>
          <div className="text-center">
            {/* Animated Shield */}
            <div className="relative w-32 h-32 mx-auto mb-6 animate-pulse">
              <svg viewBox="0 0 24 24" className="w-full h-full text-green-400" style={{ animation: 'scaleIn 0.8s ease-out forwards' }}>
                <defs>
                  <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#16a34a" />
                  </linearGradient>
                </defs>
                <path
                  fill="url(#shieldGradient)"
                  d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Protegiendo tu Acceso</h2>
            <p className="text-gray-300">Documento de consentimiento requerido</p>
          </div>
        </div>
      )}

      {/* Main Modal */}
      <div className={`bg-white rounded-3xl w-full max-w-5xl max-h-[98vh] flex flex-col shadow-2xl transition-all duration-500 p-6 ${showShieldAnimation ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white rounded-t-3xl">
          <div className="flex items-center justify-center gap-4">
            <div className="flex-1 text-center">
              <h2 className="text-xl font-bold text-gray-900">CONTRATO DE USO Y COMPROMISO DE CONFIDENCIALIDAD – AKADEMO</h2>
              <p className="text-gray-600 mt-1">
                <span className="font-medium text-brand-600">{className}</span> — Firma requerida para acceder
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* PDF Viewer - Scrollable */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-y-auto bg-gray-50 rounded-2xl border-2 border-gray-200 relative shadow-inner" 
          style={{ height: '500px' }}
        >
          {!pdfLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Cargando documento...</p>
                <p className="text-sm text-gray-500 mt-1">Por favor espera</p>
              </div>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src="/legal/consent.pdf"
            className="w-full rounded-2xl"
            style={{ height: '1200px', minHeight: '1200px' }}
            onLoad={() => setPdfLoaded(true)}
            title="Documento de Consentimiento"
          />
        </div>

        {/* Footer - Agreement and Sign Button */}
        <div className="border-t border-gray-200 bg-white rounded-b-3xl">
          {/* Scroll indicator */}
          {!hasScrolledToEnd && (
            <div className="border-2 border-blue-500 rounded-xl p-3 my-3 flex items-center justify-center gap-3">
              <svg className="w-5 h-5 text-blue-500 flex-shrink-0 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <p className="text-sm text-blue-700 font-medium">
                Desplázate hasta el final del documento para continuar
              </p>
            </div>
          )}

          {/* Checkbox Agreement */}
          <label className={`flex items-center gap-4 p-4 bg-white border-2 rounded-xl transition-colors my-3 ${
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
              <p className="text-sm font-semibold text-gray-900">
                Me comprometo a no <strong>compartir</strong> ni permitir el <strong>acceso a terceros</strong> a ningún contenido de la plataforma (vídeos, audios, textos, PDFs, enlaces, imágenes u otro material didáctico). Tampoco <strong>compartiré</strong> mi cuenta con otras personas.
              </p>
            </div>
          </label>

          {/* Action Button - Centered */}
          <div className="flex items-center justify-center">
            <button
              onClick={handleSign}
              disabled={!hasScrolledToEnd || !agreed || signing}
              className={`px-10 py-3.5 rounded-xl font-semibold transition-all flex items-center gap-3 shadow-lg ${
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
          <p className="text-xs text-gray-500 mt-4 text-center">
            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Tu firma digital queda registrada de forma segura. Este documento también requiere la aprobación del profesor.
          </p>
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes fadeOut {
          0% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; pointer-events: none; }
        }
        @keyframes scaleIn {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes slideUp {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-slideUp {
          animation: slideUp 0.5s ease-out forwards;
        }
      `}</style>
    </div>,
    document.body
  );
}
