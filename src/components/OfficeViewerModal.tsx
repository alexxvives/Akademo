'use client';

import { useEffect, useState } from 'react';

/**
 * Visor de documentos Office (Word/Excel/PowerPoint) usando el visor online de Microsoft.
 * Se muestra en modal a pantalla completa y oculta los controles de descarga del navegador.
 *
 * El visor de Microsoft (`view.officeapps.live.com`) requiere que la URL del documento
 * sea accesible públicamente. Nuestras URLs firmadas son válidas durante la vigencia
 * del token, lo cual basta para que Microsoft las descargue y renderice.
 */
export default function OfficeViewerModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');

  useEffect(() => {
    const handler = (e: CustomEvent<{ url: string; title?: string }>) => {
      // Build absolute URL (Office viewer needs an absolute, internet-reachable URL)
      let absolute = e.detail.url;
      try {
        absolute = new URL(e.detail.url, window.location.origin).toString();
      } catch { /* ignore */ }
      history.pushState({ officeModal: true }, '');
      setDocUrl(absolute);
      setTitle(e.detail.title ?? '');
      setIsOpen(true);
    };
    window.addEventListener('open-office', handler as EventListener);
    return () => window.removeEventListener('open-office', handler as EventListener);
  }, []);

  useEffect(() => {
    const onPopState = () => { if (isOpen) close(); };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [isOpen]);

  function close() {
    setIsOpen(false);
    setDocUrl(null);
    setTitle('');
    if (window.history.state?.officeModal) {
      window.history.back();
    }
  }

  if (!isOpen || !docUrl) return null;

  const viewerSrc = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(docUrl)}`;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 text-white text-sm">
        <span className="truncate">{title || 'Documento'}</span>
        <button
          onClick={close}
          className="px-3 py-1 rounded hover:bg-slate-700 transition-colors"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>
      <div className="flex-1 relative" onContextMenu={(e) => e.preventDefault()}>
        <iframe
          src={viewerSrc}
          className="absolute inset-0 w-full h-full bg-white"
          title={title || 'Documento'}
        />
      </div>
    </div>
  );
}
