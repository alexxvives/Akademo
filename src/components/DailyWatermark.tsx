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

// Bouncing DVD-logo style movement
function useBounce(speed = 0.3) {
  const [pos, setPos] = useState({ x: 30, y: 40 });
  const ref = useRef({ x: 30, y: 40, dx: speed, dy: speed * 0.75 });
  useEffect(() => {
    const id = setInterval(() => {
      const s = ref.current;
      let { x, y, dx, dy } = s;
      x += dx; y += dy;
      if (x <= 10 || x >= 78) { dx = -dx; x = Math.max(10, Math.min(78, x)); }
      if (y <= 10 || y >= 82) { dy = -dy; y = Math.max(10, Math.min(82, y)); }
      ref.current = { x, y, dx, dy };
      setPos({ x, y });
    }, 50);
    return () => clearInterval(id);
  }, [speed]);
  return pos;
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

export default function DailyWatermark({ name, email, academyName, watermarkIntervalMins = 5 }: DailyWatermarkProps) {
  const clock = useClock();
  const bouncePos = useBounce();

  const [showCenter, setShowCenter] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

      {/* Top-right: Academy name */}
      <div style={{ position: 'absolute', top: '8%', right: '8%' }}>
        <span style={badge}>{academyName ? `Academia ${academyName}` : 'AKADEMO'}</span>
      </div>

      {/* Center: bouncing watermark */}
      {showCenter && (
        <span
          style={{
            position: 'absolute',
            top: `${bouncePos.y}%`,
            left: `${bouncePos.x}%`,
            transform: 'translate(-50%, -50%)',
            fontSize: 'clamp(1.28rem, 3.2vw, 2.56rem)',
            fontWeight: 800,
            color: 'transparent',
            WebkitTextStroke: '1.5px rgba(255,255,255,0.38)',
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

      {/* Bottom-right: Live clock */}
      <div style={{ position: 'absolute', bottom: '8%', right: '8%' }}>
        <span style={badge}>{clock}</span>
      </div>
    </div>
  );
}
