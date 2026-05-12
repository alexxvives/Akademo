'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface DailyWatermarkProps {
  name: string;
  email: string;
  userId: string;
  academyName?: string;
  watermarkIntervalMins?: number;
}

function useClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function badgeStyle(fontPx: number) {
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
    userSelect: 'none' as const,
    letterSpacing: '0.01em',
    whiteSpace: 'nowrap' as const,
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

export default function DailyWatermark({ name, email, watermarkIntervalMins = 5 }: DailyWatermarkProps) {
  const clock = useClock();
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
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  return (
    <div
      ref={containerRef}
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 2,
        pointerEvents: 'none',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Top-left: Name */}
      <div style={{ position: 'absolute', top: '8%', left: '8%' }}>
        <span style={badgeStyle(badgeFontPx)}>{name}</span>
      </div>

      {/* Top-right: Email */}
      <div style={{ position: 'absolute', top: '8%', right: '8%' }}>
        <span style={badgeStyle(badgeFontPx)}>{email}</span>
      </div>

      {/* Center: random-position watermark with dark semi-transparent background */}
      {showCenter && (
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
          <span style={{
            color: 'rgba(255,255,255,0.92)',
            fontWeight: 800,
            fontSize: `${centerFontPx}px`,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            whiteSpace: 'nowrap',
            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
          }}>
            {name}
          </span>
          <span style={{
            color: 'rgba(255,255,255,0.72)',
            fontWeight: 500,
            fontSize: `${Math.round(centerFontPx * 0.65)}px`,
            whiteSpace: 'nowrap',
          }}>
            {email}
          </span>
        </div>
      )}

      {/* Bottom-right: Live clock */}
      <div style={{ position: 'absolute', bottom: '8%', right: '8%' }}>
        <span style={badgeStyle(badgeFontPx)}>{clock}</span>
      </div>
    </div>
  );
}
