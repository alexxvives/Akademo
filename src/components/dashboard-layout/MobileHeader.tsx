'use client';

import Link from 'next/link';
import Image from 'next/image';

interface MobileHeaderProps {
  role: string;
  onOpenMenu: () => void;
}

export function MobileHeader({
  role, onOpenMenu,
}: MobileHeaderProps) {
  return (
    <header className="lg:hidden flex items-center justify-between h-14 px-4 bg-white border-b border-gray-200 flex-shrink-0">
      <button
        onClick={onOpenMenu}
        className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Open menu"
      >
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <Link
        href={`/dashboard/${role.toLowerCase()}`}
        className="flex items-center gap-2"
      >
        <Image
          src="/logo/AKADEMO_logo_OTHER2.svg"
          alt="Akademo"
          width={120}
          height={24}
          className="h-6 w-auto object-contain"
        />
        <span className="font-semibold text-gray-900 text-base font-[family-name:var(--font-montserrat)]">
          AKADEMO
        </span>
      </Link>
      <div className="w-9" />
    </header>
  );
}
