'use client';

import Link from 'next/link';
import Image from 'next/image';

interface MobileHeaderProps {
  role: string;
  unreadCount: number;
  showNotifications: boolean;
  onToggleNotifications: () => void;
  onOpenMenu: () => void;
}

export function MobileHeader({
  role, unreadCount, showNotifications, onToggleNotifications, onOpenMenu,
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
      <div className="w-9 flex items-center justify-end">
        {role === 'STUDENT' && (
          <button
            onClick={onToggleNotifications}
            className="relative p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Notifications"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
}
