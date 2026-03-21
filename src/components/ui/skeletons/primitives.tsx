'use client';

/**
 * Skeleton loading primitives - base building blocks
 */

export function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );
}

export function SkeletonText({ className = '' }: { className?: string }) {
  return <SkeletonBox className={`h-4 ${className}`} />;
}
