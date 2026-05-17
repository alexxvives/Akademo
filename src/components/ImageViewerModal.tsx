'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

function drawCanvasWatermark(canvas: HTMLCanvasElement, email: string, academyName: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx || (!email && !academyName)) return;
  const { width, height } = canvas;

  const line1 = email;
  const line2 = academyName ? `ACADEMIA ${academyName.toUpperCase()}` : '';

  const shorter = Math.min(width, height);
  const SQ = Math.SQRT1_2;
  const cx = width / 2;
  const cy = height / 2;
  const angle = Math.PI / 4; // 45°

  const maxTextWidth = shorter * 0.85;

  const fittedSize = (text: string, font: string, base: number): number => {
    if (!text) return base;
    ctx.font = `${font} ${base}px Arial, sans-serif`;
    const w = ctx.measureText(text).width;
    return w > maxTextWidth ? base * (maxTextWidth / w) : base;
  };

  const size1Base = Math.max(20, shorter * 0.13);
  const size2Base = size1Base * 0.62;
  const size1 = fittedSize(line1, '', size1Base);
  const size2 = fittedSize(line2, 'bold', size2Base);

  ctx.save();
  ctx.globalAlpha = 0.80;
  ctx.fillStyle = 'rgb(180,180,180)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (line2) {
    const lineSpacing = size1Base * 0.75;
    const c1 = { x: cx + lineSpacing * SQ, y: cy + lineSpacing * SQ };
    const c2 = { x: cx - lineSpacing * SQ, y: cy - lineSpacing * SQ };

    ctx.save();
    ctx.translate(c1.x, c1.y);
    ctx.rotate(-angle);
    ctx.font = `${size1}px Arial, sans-serif`;
    ctx.fillText(line1, 0, 0);
    ctx.restore();

    ctx.save();
    ctx.translate(c2.x, c2.y);
    ctx.rotate(-angle);
    ctx.font = `bold ${size2}px Arial, sans-serif`;
    ctx.fillText(line2, 0, 0);
    ctx.restore();
  } else {
    const size = fittedSize(line1 || line2, '', size1Base);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-angle);
    ctx.font = `${size}px Arial, sans-serif`;
    ctx.fillText(line1 || line2, 0, 0);
    ctx.restore();
  }

  ctx.restore();
}

export default function ImageViewerModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const watermarkRef = useRef<{ email: string; academyName: string }>({ email: '', academyName: '' });

  const renderImage = useCallback((url: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setLoading(true);
    setError(null);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const { email, academyName } = watermarkRef.current;
      drawCanvasWatermark(canvas, email, academyName);
      setLoading(false);
    };
    img.onerror = () => {
      setError('No se pudo cargar la imagen.');
      setLoading(false);
    };
    img.src = url;
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setImageUrl(null);
  }, []);

  // Listen for open-image custom event
  useEffect(() => {
    const handler = (e: CustomEvent<{ url: string; title?: string }>) => {
      try {
        const urlObj = new URL(e.detail.url, window.location.origin);
        watermarkRef.current = {
          email: urlObj.searchParams.get('email') ?? '',
          academyName: urlObj.searchParams.get('academyName') ?? '',
        };
      } catch {
        watermarkRef.current = { email: '', academyName: '' };
      }
      history.pushState({ imageModal: true }, '');
      setImageUrl(e.detail.url);
      setTitle(e.detail.title ?? '');
      setIsOpen(true);
    };
    window.addEventListener('open-image', handler as EventListener);
    return () => window.removeEventListener('open-image', handler as EventListener);
  }, []);

  // Close on browser back button
  useEffect(() => {
    const onPopState = () => { if (isOpen) close(); };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [isOpen, close]);

  // Render image when opened
  useEffect(() => {
    if (isOpen && imageUrl) renderImage(imageUrl);
  }, [isOpen, imageUrl, renderImage]);

  // Keyboard ESC
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10001] flex flex-col"
      style={{ background: 'rgba(0,0,0,0.96)' }}
      onContextMenu={e => e.preventDefault()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 bg-gray-900 border-b border-gray-700 shrink-0">
        <span className="text-white text-sm font-medium truncate max-w-[70%]">
          {title || 'Imagen'}
        </span>
        <button
          onClick={close}
          className="text-gray-300 hover:text-white w-8 h-8 flex items-center justify-center rounded hover:bg-gray-700 text-xl"
          title="Cerrar"
          aria-label="Cerrar visor"
        >
          ✕
        </button>
      </div>

      {/* Canvas area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        {loading && (
          <div className="text-gray-400 text-sm">Cargando imagen...</div>
        )}
        {error && (
          <div className="text-red-400 text-sm">{error}</div>
        )}
        <canvas
          ref={canvasRef}
          className="max-w-full object-contain select-none"
          style={{ display: loading || error ? 'none' : 'block', maxHeight: 'calc(100vh - 3rem)' }}
          onContextMenu={e => e.preventDefault()}
        />
      </div>
    </div>
  );
}
