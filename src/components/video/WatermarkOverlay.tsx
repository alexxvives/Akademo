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

function badgeStyle(fontPx: number): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    background: 'rgba(0,0,0,0.78)',
    color: '#fff',
    fontSize: `${fontPx}px`,
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
}

function randomPos() {
  return {
    x: `${(12 + Math.random() * 55).toFixed(1)}%`,
    y: `${(12 + Math.random() * 55).toFixed(1)}%`,
  };
}

function VideoWatermarkContent({
  showWatermark,
  studentName,
  studentEmail,
  watermarkIntervalMins = 5,
}: Omit<WatermarkOverlayProps, 'plyrContainer' | 'isUnlimitedUser' | 'studentId' | 'academyName'> & { academyName?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [badgeFontPx, setBadgeFontPx] = useState(11);
  const [centerFontPx, setCenterFontPx] = useState(18);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setBadgeFontPx(Math.max(11, Math.min(22, w * 0.012)));
      setCenterFontPx(Math.max(14, Math.min(40, w * 0.028)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [showCenter, setShowCenter] = useState(true);
  const [centerPos, setCenterPos] = useState(randomPos);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleNext = useCallback((visible: boolean) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const delay = visible ? 30000 : watermarkIntervalMins * 60 * 1000;
    timerRef.current = setTimeout(() => {
      const nextVisible = !visible;
      if (nextVisible) setCenterPos(randomPos());
      setShowCenter(nextVisible);
      scheduleNext(nextVisible);
    }, delay);
  }, [watermarkIntervalMins]);

  useEffect(() => {
    setShowCenter(true);
    timerRef.current = setTimeout(() => {
      setShowCenter(false);
      scheduleNext(false);
    }, 30000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [scheduleNext]);

  if (!showWatermark && !showCenter) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden
      style={{ position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none', userSelect: 'none', overflow: 'hidden' }}
    >
      {/* Top-left: Name */}
      {showWatermark && studentName && (
        <div style={{ position: 'absolute', top: '8%', left: '8%' }}>
          <span style={badgeStyle(badgeFontPx)}>{studentName}</span>
        </div>
      )}

      {/* Top-right: Email */}
      {showWatermark && studentEmail && (
        <div style={{ position: 'absolute', top: '8%', right: '8%' }}>
          <span style={badgeStyle(badgeFontPx)}>{studentEmail}</span>
        </div>
      )}

      {/* Center: random-position watermark with dark semi-transparent background */}
      {showCenter && (studentName || studentEmail) && (
        <div style={{
          position: 'absolute',
          top: centerPos.y,
          left: centerPos.x,
          background: 'rgba(0,0,0,0.42)',
          borderRadius: '8px',
          padding: '10px 18px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          backdropFilter: 'blur(4px)',
        }}>
          {studentName && (
            <span style={{
              color: 'rgba(255,255,255,0.92)',
              fontWeight: 800,
              fontSize: `${centerFontPx}px`,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              whiteSpace: 'nowrap',
              textShadow: '0 1px 4px rgba(0,0,0,0.6)',
            }}>
              {studentName}
            </span>
          )}
          {studentEmail && (
            <span style={{
              color: 'rgba(255,255,255,0.72)',
              fontWeight: 500,
              fontSize: `${Math.round(centerFontPx * 0.65)}px`,
              whiteSpace: 'nowrap',
            }}>
              {studentEmail}
            </span>
          )}
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
      academyName={academyName}
      watermarkIntervalMins={watermarkIntervalMins}
    />
  );

  return plyrContainer ? createPortal(content, plyrContainer) : content;
}

export function BrandWatermark({ academyName }: { academyName?: string }) {
  return null;
}

