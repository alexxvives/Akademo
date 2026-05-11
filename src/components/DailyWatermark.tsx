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

function randomCenterPos() {
  // Keep within 25–75% so the large text doesn't clip at edges
  return {
    x: 25 + Math.random() * 50,
    y: 25 + Math.random() * 50,
  };
}

const badge = {
  display: 'inline-flex',
  alignItems: 'center',
  background: 'rgba(0,0,0,0.78)',
  color: '#fff',
  fontSize: '0.72rem',
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

export default function DailyWatermark({ name, email, userId, academyName, watermarkIntervalMins = 5 }: DailyWatermarkProps) {
  const clock = useClock();
  const shortId = userId ? `#${userId.slice(0, 8).toUpperCase()}` : '';

  // Intermittent center watermark: show for first 60s, then 30s on / interval off
  const [showCenter, setShowCenter] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const initialPhaseRef = useRef(true);

  // Moving position for the center watermark
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
    initialPhaseRef.current = true;
    timerRef.current = setTimeout(() => {
      initialPhaseRef.current = false;
      setShowCenter(false);
      scheduleNext(false);
    }, 60000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [scheduleNext]);

  // Move the center watermark to a new random position every 8 seconds
  useEffect(() => {
    const moveId = setInterval(() => {
      setCenterPos(randomCenterPos());
    }, 8000);
    return () => clearInterval(moveId);
  }, []);

  return (
    <div
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
      {/* Top-left: Email */}
      <div style={{ position: 'absolute', top: '8%', left: '8%' }}>
        <span style={badge}>{email}</span>
      </div>

      {/* Top-right: Academy name (falls back to student name) */}
      <div style={{ position: 'absolute', top: '8%', right: '8%' }}>
        <span style={badge}>{academyName ? `Academia ${academyName}` : name}</span>
      </div>

      {/* Center: large diagonal watermark — moves every 8s with smooth transition */}
      {showCenter && (
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
            paintOrder: 'stroke fill' as any,
          }}
        >
          {name}
        </span>
      )}

      {/* Bottom-left: User ID */}
      <div style={{ position: 'absolute', bottom: '8%', left: '8%' }}>
        <span style={badge}>ID: {shortId}</span>
      </div>

      {/* Bottom-right: Live clock */}
      <div style={{ position: 'absolute', bottom: '8%', right: '8%' }}>
        <span style={badge}>{clock}</span>
      </div>
    </div>
  );
}
