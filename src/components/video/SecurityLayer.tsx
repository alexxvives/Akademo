'use client';

interface LockedOverlayProps {
  isLocked: boolean;
}

export function LockedOverlay({ isLocked }: LockedOverlayProps) {
  if (!isLocked) return null;

  return (
    <div className="absolute inset-0 z-[10000] bg-gray-900 flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
      <div className="relative max-w-md mx-auto text-center p-8">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="h-10 w-10 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Límite de Tiempo Alcanzado</h3>
        <p className="text-gray-400 text-sm">
          Contacta a tu profesor si necesitas más tiempo.
        </p>
      </div>
    </div>
  );
}

interface LoadingIndicatorProps {
  isLoading: boolean;
}

export function LoadingIndicator({ isLoading }: LoadingIndicatorProps) {
  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-40">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        <span className="text-white text-sm">Cargando video...</span>
      </div>
    </div>
  );
}

interface TranscodingStatusProps {
  transcodingStatus: string | null;
}

export function TranscodingStatus({ transcodingStatus }: TranscodingStatusProps) {
  if (transcodingStatus !== 'processing') return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-40">
      <div
        className="flex flex-col items-center gap-4 max-w-md px-6"
        style={{ minHeight: '400px' }}
      >
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-white text-lg font-semibold mb-2">
            Video en proceso de transcodificación
          </h3>
          <p className="text-gray-400 text-sm mb-3">
            El video se está procesando y optimizando para su reproducción. Este proceso puede
            tardar unos minutos dependiendo de la duración del video.
          </p>
          <div className="flex items-center justify-center gap-2 text-blue-400 text-xs">
            <div className="animate-pulse w-2 h-2 bg-blue-400 rounded-full"></div>
            <span>Actualizando automáticamente...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ErrorMessageProps {
  error: string | null;
}

export function ErrorMessage({ error }: ErrorMessageProps) {
  if (!error) return null;

  return (
    <div className="bg-red-900/50 border-l-4 border-red-500 p-4">
      <div className="flex items-center gap-3">
        <svg
          className="h-5 w-5 text-red-400 flex-shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        <p className="text-sm text-red-200">{error}</p>
      </div>
    </div>
  );
}

// CSS to hide Plyr controls when video is locked
export const hiddenControlsStyle = `
  .plyr-controls-hidden .plyr__controls,
  .plyr-controls-hidden .plyr__control--overlaid {
    display: none !important;
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }
`;
