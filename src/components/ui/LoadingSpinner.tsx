'use client';

import { LoaderPinwheelIcon } from './LoaderPinwheelIcon';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 48,
};

/**
 * Loading spinner for inline use (buttons, dropdowns, status indicators)
 * For full-page loading, use SkeletonLoader components instead
 */
export function LoadingSpinner({ size = 'md', className = '', label }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <LoaderPinwheelIcon size={sizeMap[size]} className="text-black" />
      {label && <span className="text-sm text-gray-500">{label}</span>}
    </div>
  );
}

export default LoadingSpinner;
