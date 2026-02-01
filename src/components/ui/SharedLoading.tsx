'use client';

/**
 * Shared loading state for inline use (buttons, dropdowns, etc.)
 * For full-page loading, use SkeletonLoader components instead
 */
export default function SharedLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 animate-spin rounded-full border-2 border-gray-300 border-t-emerald-600 mx-auto" />
        <p className="text-gray-500 text-sm">Cargando...</p>
      </div>
    </div>
  );
}
