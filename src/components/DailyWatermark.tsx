'use client';

import { useEffect, useState } from 'react';

interface DailyWatermarkProps {
  name: string;
  email: string;
  userId: string;
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

export default function DailyWatermark({ name, email, userId }: DailyWatermarkProps) {
  const clock = useClock();
  const shortId = userId ? `#${userId.slice(0, 8).toUpperCase()}` : '';

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
      {/* Top-left: Name */}
      <div style={{ position: 'absolute', top: 14, left: 14 }}>
        <span style={badge}>{name}</span>
      </div>

      {/* Top-right: Email */}
      <div style={{ position: 'absolute', top: 14, right: 14 }}>
        <span style={badge}>{email}</span>
      </div>

      {/* Center: large diagonal full name */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            transform: 'rotate(-30deg)',
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
      </div>

      {/* Bottom-left: User ID */}
      <div style={{ position: 'absolute', bottom: 14, left: 14 }}>
        <span style={badge}>ID: {shortId}</span>
      </div>

      {/* Bottom-right: Live clock */}
      <div style={{ position: 'absolute', bottom: 14, right: 14 }}>
        <span style={badge}>{clock}</span>
      </div>
    </div>
  );
}
