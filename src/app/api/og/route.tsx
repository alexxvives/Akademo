import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

const categoryAccents: Record<string, string> = {
  'Protección': '#fb7185',
  'Seguridad':  '#fbbf24',
  'Gestión':    '#60a5fa',
  'Precios':    '#34d399',
  'Crecimiento':'#a78bfa',
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title    = searchParams.get('title')    ?? 'AKADEMO Blog';
  const category = searchParams.get('category') ?? '';
  const accent   = categoryAccents[category]    ?? '#818cf8';

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '64px 72px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '22px',
              fontWeight: '800',
            }}
          >
            A
          </div>
          <span style={{ color: '#e0e7ff', fontSize: '22px', fontWeight: '700' }}>AKADEMO</span>
          <span style={{ color: '#374151', fontSize: '20px', marginLeft: '4px' }}>· Blog</span>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '960px' }}>
          {category ? (
            <div
              style={{
                display: 'inline-flex',
                padding: '5px 14px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.07)',
                border: `1px solid rgba(255,255,255,0.12)`,
                color: accent,
                fontSize: '18px',
                fontWeight: '600',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                width: 'fit-content',
              }}
            >
              {category}
            </div>
          ) : null}
          <div
            style={{
              fontSize: title.length > 70 ? '42px' : title.length > 50 ? '48px' : '54px',
              fontWeight: '700',
              color: 'white',
              lineHeight: '1.25',
            }}
          >
            {title}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: accent }} />
          <span style={{ color: '#9ca3af', fontSize: '18px' }}>akademo-edu.com</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
