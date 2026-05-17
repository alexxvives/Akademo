'use client';

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif' }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Algo salió mal</h1>
            <p style={{ color: '#666', marginBottom: '2rem' }}>Ha ocurrido un error inesperado.</p>
            <button
              onClick={reset}
              style={{ padding: '12px 24px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' }}
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
