'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState, useCallback, useRef } from 'react';

interface WatermarkOverlayProps {
  showWatermark: boolean;
  studentName?: string;
  studentEmail?: string;
  studentId?: string;
  academyName?: string;
  plyrContainer: HTMLElement | null;
  isUnlimitedUser: boolean;
  watermarkIntervalMins?: number;
}

const badge: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  background: 'rgba(0,0,0,0.78)',
  color: '#fff',
  fontSize: '1.44rem',
  fontWeight: 600,
  padding: '4px 10px',
  borderRadius: '5px',
  backdropFilter: 'blur(6px)',
  userSelect: 'none',
  letterSpacing: '0.01em',
  whiteSpace: 'nowrap',
  border: '1px solid rgba(255,255,255,0.18)',
  textShadow: '0 1px 3px rgba(0,0,0,0.8)',
};

// Pixel-based DVD-logo bounce — adapts to actual container size on every tick
function useBounce(
  containerRef: { current: HTMLElement | null },
  textRef: { current: HTMLElement | null },
  speed = 1.5
) {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const stateRef = useRef({ x: 50, y: 50, dx: speed, dy: speed * 0.75 });

  useEffect(() => {
    const id = setInterval(() => {
      const cw = containerRef.current?.clientWidth ?? 600;
      const ch = containerRef.current?.clientHeight ?? 400;
      const tw = textRef.current?.offsetWidth ?? 120;
      const th = textRef.current?.offsetHeight ?? 30;

      const maxX = Math.max(0, cw - tw);
      const maxY = Math.max(0, ch - th);

      const s = stateRef.current;
      let { x, y, dx, dy } = s;
      x += dx; y += dy;
      if (x <= 0 || x >= maxX) { dx = -dx; x = Math.max(0, Math.min(maxX, x)); }
      if (y <= 0 || y >= maxY) { dy = -dy; y = Math.max(0, Math.min(maxY, y)); }
      stateRef.current = { x, y, dx, dy };
      setPos({ x, y });
    }, 50);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return pos;
}

function VideoWatermarkContent({
  showWatermark,
  studentName,
  studentEmail,
  academyName,
  watermarkIntervalMins = 5,
}: Omit<WatermarkOverlayProps, 'plyrContainer' | 'isUnlimitedUser' | 'studentId'>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const bouncePos = useBounce(containerRef, textRef);

  const [fontSize, setFontSize] = useState(18);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setFontSize(Math.max(12, Math.min(36, w * 0.025)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [showCenter, setShowCenter] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleNext = useCallback((visible: boolean) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const delay = visible ? 30000 : watermarkIntervalMins * 60 * 1000;
    timerRef.current = setTimeout(() => {
      setShowCenter(!visible);
      scheduleNext(!visible);
    }, delay);
  }, [watermarkIntervalMins]);

  useEffect(() => {
    setShowCenter(true);
    timerRef.current = setTimeout(() => {
      setShowCenter(false);
      scheduleNext(false);
    }, 60000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [scheduleNext]);

  if (!showWatermark && !showCenter) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden
      style={{ position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none', userSelect: 'none', overflow: 'hidden' }}
    >
      {/* Top-left: Email */}
      {studentEmail && (
        <div style={{ position: 'absolute', top: '8%', left: '8%' }}>
          <span style={badge}>{studentEmail}</span>
        </div>
      )}

      {/* Top-right: Academy name */}
      <div style={{ position: 'absolute', top: '8%', right: '8%' }}>
        <span style={badge}>{academyName ? `Academia ${academyName}` : 'AKADEMO'}</span>
      </div>

      {/* Center: bouncing watermark — pixel-positioned, always fully visible */}
      {showCenter && studentName && (
        <span
          ref={textRef}
          style={{
            position: 'absolute',
            top: bouncePos.y,
            left: bouncePos.x,
            fontSize: `${fontSize}px`,
            fontWeight: 800,
            color: 'rgba(255,255,255,0.9)',
            textTransform: 'uppercase',
            letterSpacing: '0.20em',
            whiteSpace: 'nowrap',
            textShadow: '0 0 24px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.6)',
          }}
        >
          {studentName}
        </span>
      )}
    </div>
  );
}

export function WatermarkOverlay({
  showWatermark,
  studentName,
  studentEmail,
  studentId,
  academyName,
  plyrContainer,
  isUnlimitedUser,
  watermarkIntervalMins,
}: WatermarkOverlayProps) {
  if (isUnlimitedUser || !studentEmail) return null;

  const content = (
    <VideoWatermarkContent
      showWatermark={showWatermark}
      studentName={studentName}
      studentEmail={studentEmail}
      academyName={academyName}
      watermarkIntervalMins={watermarkIntervalMins}
    />
  );

  return plyrContainer ? createPortal(content, plyrContainer) : content;
}

export function BrandWatermark({ academyName }: { academyName?: string }) {
  return null;
}

