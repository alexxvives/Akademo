'use client';

import { LoadingSpinner } from './LoadingSpinner';

interface PageLoaderProps {
  label?: string;
  fullScreen?: boolean;
}

export function PageLoader({ label = 'Cargando...', fullScreen = false }: PageLoaderProps) {
  const containerClass = fullScreen
    ? 'fixed inset-0 bg-white/80 backdrop-blur-sm z-50'
    : 'min-h-[400px]';

  return (
    <div className={`flex items-center justify-center ${containerClass}`}>
      <LoadingSpinner size="lg" label={label} />
    </div>
  );
}

export default PageLoader;
