'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface DailyWatermarkProps {
  name: string;
  email: string;
  userId: string;
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

const badge = {
  display: 'inline-flex',
  alignItems: 'center',
  background: 'rgba(0,0,0,0.62)',
  color: '#fff',
  fontSize: '0.72rem',
  fontWeight: 500,
  padding: '3px 9px',
  borderRadius: '5px',
  backdropFilter: 'blur(4px)',
  userSelect: 'none' as const,
  letterSpacing: '0.01em',
  whiteSpace: 'nowrap' as const,
  border: '1px solid rgba(255,255,255,0.10)',
};

export default function DailyWatermark({ name, email, userId, watermarkIntervalMins = 5 }: DailyWatermarkProps) {
  const clock = useClock();
  const shortId = userId ? `#${userId.slice(0, 8).toUpperCase()}` : '';

  // Intermittent center watermark: show for first 60s, then 30s on / interval off
  const [showCenter, setShowCenter] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const initialPhaseRef = useRef(true);

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
    initialPhaseRef.current = true;
    // Stay visible for first 60s, then start intermittent cycle
    timerRef.current = setTimeout(() => {
      initialPhaseRef.current = false;
      setShowCenter(false);
      scheduleNext(false);
    }, 60000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [scheduleNext]);

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 2,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {/* Top-left: Name — positioned near video edge */}
      <div style={{ position: 'absolute', top: '12%', left: '12%' }}>
        <span style={badge}>{name}</span>
      </div>

      {/* Top-right: Email — positioned near video edge */}
      <div style={{ position: 'absolute', top: '12%', right: '22%' }}>
        <span style={badge}>{email}</span>
      </div>

      {/* Center: large diagonal full name — intermittent, anchored to center of badge rectangle */}
      {showCenter && (
        <span
          style={{
            position: 'absolute',
            top: '50%',
            left: '45%',
            transform: 'translate(-50%, -50%) rotate(-30deg)',
            fontSize: 'clamp(1.4rem, 3.5vw, 2.8rem)',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.12)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            whiteSpace: 'nowrap',
            textShadow: '0 1px 4px rgba(0,0,0,0.4)',
          }}
        >
          {name}
        </span>
      )}

      {/* Bottom-left: User ID — positioned near video edge */}
      <div style={{ position: 'absolute', bottom: '12%', left: '12%' }}>
        <span style={badge}>ID: {shortId}</span>
      </div>

      {/* Bottom-right: Live clock — positioned near video edge */}
      <div style={{ position: 'absolute', bottom: '12%', right: '22%' }}>
        <span style={badge}>{clock}</span>
      </div>
    </div>
  );
}
