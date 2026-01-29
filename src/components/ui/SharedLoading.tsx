'use client';

import { LoaderPinwheelIcon } from './LoaderPinwheelIcon';

/**
 * Shared loading state for inline use (buttons, dropdowns, etc.)
 * For full-page loading, use SkeletonLoader components instead
 */
export default function SharedLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <LoaderPinwheelIcon size={32} className="text-black mx-auto" />
        <p className="text-gray-500 text-sm">Cargando...</p>
      </div>
    </div>
  );
}
