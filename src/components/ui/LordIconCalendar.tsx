'use client';

/**
 * Lordicon calendar icon – uses the hosted JSON from cdn.lordicon.com.
 * The <lord-icon> custom element is registered by the script added in layout.tsx.
 * Type declarations live in src/types/lordicon.d.ts
 */
export function LordIconCalendar({ size = 20 }: { size?: number }) {
  return (
    <lord-icon
      src="https://cdn.lordicon.com/uoljexdg.json"
      trigger="hover"
      colors="primary:#9ca3af"
      style={{ width: size, height: size, display: 'block' }}
    />
  );
}
