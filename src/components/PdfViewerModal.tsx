'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type PdfJsLib = typeof import('pdfjs-dist');
type PDFDocumentProxy = import('pdfjs-dist').PDFDocumentProxy;
type RenderTask = import('pdfjs-dist').RenderTask;

let cachedPdfJs: PdfJsLib | null = null;

async function getPdfJs(): Promise<PdfJsLib> {
  if (!cachedPdfJs) {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc =
      `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    cachedPdfJs = pdfjs;
  }
  return cachedPdfJs;
}

export default function PdfViewerModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const scaleRef = useRef(1.5);

  useEffect(() => { scaleRef.current = scale; }, [scale]);

  const renderPage = useCallback(async (pageNum: number, pageScale: number) => {
    if (!pdfDocRef.current || !canvasRef.current) return;
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }
    const page = await pdfDocRef.current.getPage(pageNum);
    const viewport = page.getViewport({ scale: pageScale });
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    const task = page.render({ canvasContext: ctx, viewport } as Parameters<typeof page.render>[0]);
    renderTaskRef.current = task;
    try {
      await task.promise;
    } catch (e: unknown) {
      if ((e as Error)?.name !== 'RenderingCancelledException') throw e;
    }
  }, []);

  const loadPdf = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    setCurrentPage(1);
    setTotalPages(0);
    try {
      const pdfjs = await getPdfJs();
      if (pdfDocRef.current) {
        await pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }
      const doc = await pdfjs.getDocument(url).promise;
      pdfDocRef.current = doc;
      setTotalPages(doc.numPages);
      await renderPage(1, scaleRef.current);
    } catch (e) {
      console.error('[PdfViewer] Error:', e);
      setError('No se pudo cargar el documento.');
    } finally {
      setLoading(false);
    }
  }, [renderPage]);

  // Listen for open-pdf custom event
  useEffect(() => {
    const handler = (e: CustomEvent<{ url: string; title?: string }>) => {
      // Push a history entry so the browser back button closes the modal
      history.pushState({ pdfModal: true }, '');
      setPdfUrl(e.detail.url);
      setTitle(e.detail.title ?? '');
      setIsOpen(true);
    };
    window.addEventListener('open-pdf', handler as EventListener);
    return () => window.removeEventListener('open-pdf', handler as EventListener);
  }, []);

  // Close modal when user hits browser back button
  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      if (isOpen) close();
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [isOpen]);

  // Load PDF when opened
  useEffect(() => {
    if (isOpen && pdfUrl) loadPdf(pdfUrl);
    if (!isOpen && pdfDocRef.current) {
      pdfDocRef.current.destroy();
      pdfDocRef.current = null;
    }
  }, [isOpen, pdfUrl, loadPdf]);

  // Re-render on page or scale change
  useEffect(() => {
    if (pdfDocRef.current) renderPage(currentPage, scale);
  }, [currentPage, scale, renderPage]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown')
        setCurrentPage(p => Math.min(totalPages, p + 1));
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')
        setCurrentPage(p => Math.max(1, p - 1));
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [isOpen, totalPages]);

  const close = () => {
    setIsOpen(false);
    setPdfUrl(null);
    setTotalPages(0);
    setCurrentPage(1);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10001] flex flex-col"
      style={{ background: 'rgba(0,0,0,0.96)' }}
      onContextMenu={e => e.preventDefault()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 bg-gray-900 border-b border-gray-700 shrink-0">
        <span className="text-white text-sm font-medium truncate max-w-[50%]">
          {title || 'Documento'}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setScale(s => Math.max(0.5, +(s - 0.25).toFixed(2)))}
            className="text-gray-300 hover:text-white w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 text-xl"
            title="Reducir zoom"
          >
            −
          </button>
          <span className="text-gray-400 text-xs w-12 text-center select-none">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(s => Math.min(3, +(s + 0.25).toFixed(2)))}
            className="text-gray-300 hover:text-white w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 text-xl"
            title="Ampliar zoom"
          >
            +
          </button>
          <button
            onClick={close}
            className="text-gray-300 hover:text-white w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 ml-3"
            title="Cerrar (Esc)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* PDF canvas area */}
      <div className="flex-1 overflow-auto flex flex-col items-center py-6 bg-gray-800 select-none">
        {loading && (
          <div className="m-auto flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
            <span className="text-gray-400 text-sm">Cargando documento...</span>
          </div>
        )}
        {error && (
          <div className="m-auto text-red-400 text-sm">{error}</div>
        )}
        <canvas
          ref={canvasRef}
          className="shadow-2xl rounded"
          style={{ display: loading || error ? 'none' : 'block', maxWidth: '100%' }}
          onContextMenu={e => e.preventDefault()}
        />
      </div>

      {/* Footer navigation */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 h-12 bg-gray-900 border-t border-gray-700 shrink-0">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-default px-3 py-1 text-sm rounded hover:bg-gray-700"
          >
            ← Anterior
          </button>
          <span className="text-gray-400 text-sm select-none">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-default px-3 py-1 text-sm rounded hover:bg-gray-700"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
