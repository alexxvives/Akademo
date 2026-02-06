'use client';

import { useRef } from 'react';
import { CctvIcon, CctvIconHandle } from '@/components/icons/CctvIcon';

interface ZoomConnectButtonProps {
  onClick: () => void;
}

/**
 * Animated Zoom Connect Button Component
 * Used in academy profile page to initiate Zoom OAuth connection
 */
export function ZoomConnectButton({ onClick }: ZoomConnectButtonProps) {
  const iconRef = useRef<CctvIconHandle>(null);
  
  return (
    <button
      type="button"
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      onClick={onClick}
      onMouseEnter={() => iconRef.current?.startAnimation()}
      onMouseLeave={() => iconRef.current?.stopAnimation()}
    >
      <CctvIcon ref={iconRef} size={20} />
      Conectar Zoom
    </button>
  );
}
