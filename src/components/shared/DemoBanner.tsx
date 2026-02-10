"use client";


interface DemoBannerProps {
  userEmail?: string | null;
}

export function DemoBanner({ userEmail }: DemoBannerProps) {
  // Show for all demo% accounts (regardless of payment status)
  // Demo% users never see DemoDataBanner
  if (!userEmail?.toLowerCase().includes("demo")) {
    return null;
  }

  return (
    <div className="bg-red-600 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span>
        Esta es una cuenta de demostración con datos de prueba. Los cambios no son permanentes.
      </span>
    </div>
  );
}

