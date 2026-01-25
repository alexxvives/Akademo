'use client';

import Link from 'next/link';

export function DemoDataBanner() {
  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 border-b-4 border-amber-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-sm sm:text-base">
                📊 Estás viendo datos de demostración
              </p>
              <p className="text-amber-50 text-xs sm:text-sm">
                Estos datos son solo para mostrar cómo se vería tu academia con contenido real
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/academy/facturas"
            className="flex-shrink-0 px-6 py-2.5 bg-white text-amber-600 font-bold rounded-lg hover:bg-amber-50 transition-all shadow-md hover:shadow-xl transform hover:scale-105 text-sm sm:text-base whitespace-nowrap"
          >
            🚀 Activar Mi Academia
          </Link>
        </div>
      </div>
    </div>
  );
}
