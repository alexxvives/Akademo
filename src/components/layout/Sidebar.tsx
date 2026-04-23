'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAcademyLogo } from '@/hooks/useAcademyLogo';
import { SidebarNav } from './SidebarNav';
import { SidebarBottom } from './SidebarBottom';
import type { SidebarProps } from './SidebarTypes';

export type { MenuItem, IconHandle, SidebarProps } from './SidebarTypes';

export function Sidebar({
  role,
  menuItems,
  academyId: _academyId,
  linkCopied,
  onCopyJoinLink,
  onCopyAcademyLink,
  onLogout,
  user,
  academyPaymentStatus: _academyPaymentStatus,
}: SidebarProps) {
  const pathname = usePathname();
  const { logoUrl, academyName, loading } = useAcademyLogo();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('sidebar-collapsed') === 'true') setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

  return (
    <aside className={`hidden lg:flex flex-col bg-[#1a1d29] h-full overflow-hidden transition-[width] duration-300 ease-in-out ${collapsed ? 'w-[72px]' : 'w-[340px]'}`}>
      {/* Logo + collapse toggle */}
      <div className="flex-shrink-0 h-20 flex items-center px-3 gap-2">
        {!collapsed && (
          <Link
            href={`/dashboard/${role.toLowerCase()}`}
            className="flex items-center gap-2 flex-1 min-w-0"
          >
            {logoUrl ? (
              <>
                <Image
                  src={`/api/storage/serve/${logoUrl}`}
                  alt="Academy Logo"
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain flex-shrink-0"
                  priority
                  unoptimized
                />
                {academyName && (
                  <span className="text-lg font-bold text-gray-400 font-[family-name:var(--font-montserrat)] truncate">
                    {academyName}
                  </span>
                )}
              </>
            ) : loading ? (
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 bg-gray-700 animate-pulse rounded flex-shrink-0" />
                <div className="h-6 w-24 bg-gray-700 animate-pulse rounded" />
              </div>
            ) : (
              <>
                <Image
                  src="/logo/AKADEMO_logo_OTHER2.svg"
                  alt="Akademo"
                  width={120}
                  height={32}
                  className="h-8 w-auto object-contain"
                />
                <span className="text-lg font-bold text-gray-400 font-[family-name:var(--font-montserrat)]">
                  AKADEMO
                </span>
              </>
            )}
          </Link>
        )}

        {/* Collapse toggle button */}
        <button
          onClick={toggleCollapsed}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-gray-700/60 transition-colors ${collapsed ? 'mx-auto' : ''}`}
        >
          {collapsed ? (
            /* panel-right-open: expand */
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
              <polyline points="14 9 17 12 14 15"/>
            </svg>
          ) : (
            /* panel-left-close: collapse */
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
              <polyline points="14 15 11 12 14 9"/>
            </svg>
          )}
        </button>
      </div>

      {/* Scrollable navigation */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
        <SidebarNav menuItems={menuItems} role={role} pathname={pathname} collapsed={collapsed} />
      </div>

      {/* Fixed bottom section */}
      <SidebarBottom
        role={role}
        user={user}
        linkCopied={linkCopied}
        onCopyJoinLink={onCopyJoinLink}
        onCopyAcademyLink={onCopyAcademyLink}
        onLogout={onLogout}
        collapsed={collapsed}
      />
    </aside>
  );
}
