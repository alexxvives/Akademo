'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeMap = {
  sm: '20px',
  md: '24px',
  lg: '32px',
};

/**
 * Loading spinner for inline use (buttons, dropdowns, status indicators)
 * For full-page loading, use SkeletonLoader components instead
 */
export function LoadingSpinner({ size = 'md', className = '', label }: LoadingSpinnerProps) {
  const sizeClass = sizeMap[size];
  
  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <div 
        className="animate-spin rounded-full border-2 border-gray-300 border-t-emerald-600"
        style={{ width: sizeClass, height: sizeClass }}
      />
      {label && <span className="text-sm text-gray-500">{label}</span>}
    </div>
  );
}

export default LoadingSpinner;
