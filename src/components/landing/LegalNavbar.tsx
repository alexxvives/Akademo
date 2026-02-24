'use client';

import Image from 'next/image';
import Link from 'next/link';

export function LegalNavbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40">
      <div className="mx-3 sm:mx-6 mt-3 sm:mt-4">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg bg-white/80 border border-gray-200/50">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image
                src="/logo/AKADEMO_logo_OTHER2.svg"
                alt="AKADEMO"
                width={140}
                height={36}
                className="h-7 sm:h-8 w-auto"
              />
              <span className="text-lg sm:text-xl font-bold text-gray-900 font-[family-name:var(--font-montserrat)]">
                AKADEMO
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/?modal=login"
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/?modal=register"
                className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-all shadow-sm"
              >
                Empieza gratis
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
