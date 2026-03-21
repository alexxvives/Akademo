'use client';

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

  return (
    <aside className="hidden lg:flex flex-col bg-[#1a1d29] w-[284px] h-full">
      {/* Logo */}
      <div className="flex-shrink-0 h-20 flex items-center justify-center px-4 gap-2">
        <Link href={`/dashboard/${role.toLowerCase()}`} className="flex items-center gap-2">
          {logoUrl ? (
            <>
              <Image
                src={`/api/storage/serve/${logoUrl}`}
                alt="Academy Logo"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
                priority
                unoptimized
              />
              {academyName && (
                <span className="text-lg font-bold text-gray-400 font-[family-name:var(--font-montserrat)]">
                  {academyName}
                </span>
              )}
            </>
          ) : loading ? (
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-gray-700 animate-pulse rounded" />
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
      </div>

      {/* Scrollable navigation */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
        <SidebarNav menuItems={menuItems} role={role} pathname={pathname} />
      </div>

      {/* Fixed bottom section */}
      <SidebarBottom
        role={role}
        user={user}
        linkCopied={linkCopied}
        onCopyJoinLink={onCopyJoinLink}
        onCopyAcademyLink={onCopyAcademyLink}
        onLogout={onLogout}
      />
    </aside>
  );
}
