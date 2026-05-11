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

// Shared badge style — identical to DailyWatermark
const badge: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  background: 'rgba(0,0,0,0.78)',
  color: '#fff',
  fontSize: '0.72rem',
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

function randomPos() {
  return { x: 25 + Math.random() * 50, y: 25 + Math.random() * 50 };
}

function VideoWatermarkContent({
  showWatermark,
  studentName,
  studentEmail,
  studentId,
  academyName,
  watermarkIntervalMins = 5,
}: Omit<WatermarkOverlayProps, 'plyrContainer' | 'isUnlimitedUser'>) {
  const shortId = studentId ? `#${studentId.slice(0, 8).toUpperCase()}` : '';

  const [showCenter, setShowCenter] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [centerPos, setCenterPos] = useState({ x: 50, y: 50 });

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

  useEffect(() => {
    const id = setInterval(() => setCenterPos(randomPos()), 8000);
    return () => clearInterval(id);
  }, []);

  // Don't render corner badges when watermark is fully off
  if (!showWatermark && !showCenter) return null;

  return (
    <div
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

      {/* Center: large diagonal — moves every 8s */}
      {showCenter && studentName && (
        <span
          style={{
            position: 'absolute',
            top: `${centerPos.y}%`,
            left: `${centerPos.x}%`,
            transform: 'translate(-50%, -50%) rotate(-30deg)',
            transition: 'top 2.5s ease-in-out, left 2.5s ease-in-out',
            fontSize: 'clamp(3.2rem, 8vw, 6.4rem)',
            fontWeight: 800,
            color: 'transparent',
            WebkitTextStroke: '2px rgba(255,255,255,0.38)',
            textTransform: 'uppercase',
            letterSpacing: '0.20em',
            whiteSpace: 'nowrap',
            textShadow: '0 0 24px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.6)',
            paintOrder: 'stroke fill',
          } as React.CSSProperties}
        >
          {studentName}
        </span>
      )}

      {/* Bottom-left: User ID */}
      {shortId && (
        <div style={{ position: 'absolute', bottom: '8%', left: '8%' }}>
          <span style={badge}>ID: {shortId}</span>
        </div>
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
      studentId={studentId}
      academyName={academyName}
      watermarkIntervalMins={watermarkIntervalMins}
    />
  );

  return plyrContainer ? createPortal(content, plyrContainer) : content;
}

// Kept for backward compatibility — no longer needed as BrandWatermark is inside WatermarkOverlay
export function BrandWatermark({ academyName }: { academyName?: string }) {
  return null;
}

