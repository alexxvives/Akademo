'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChartNoAxesColumnIncreasingIcon, BookTextIcon, UserRoundPlusIcon, MessageSquareMoreIcon, ClapIcon, FileTextIcon, ClipboardCheckIcon, ActivityIcon } from '@/components/ui';
import { UsersIcon } from '@/components/ui/UsersIcon';
import { BotMessageSquareIcon } from '@/components/ui/BotMessageSquareIcon';
import { HandCoinsIcon } from '@/components/ui/HandCoinsIcon';
import { PenToolIcon } from '@/components/ui/PenToolIcon';
import { CalendarDaysIcon } from '@/components/ui/CalendarDaysIcon';
import { FolderOpenIcon } from '@/components/ui/FolderOpenIcon';
import type { MenuItem } from './SidebarTypes';
import { MobileSidebarBottom } from './MobileSidebarBottom';

interface MobileSidebarProps {
  isOpen: boolean;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'ACADEMY';
  menuItems: MenuItem[];
  linkCopied: boolean;
  onClose: () => void;
  onCopyJoinLink: () => void;
  onCopyAcademyLink: () => void;
  onLogout: () => void;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  academyPaymentStatus?: string | null;
}

export function MobileSidebar({
  isOpen,
  role,
  menuItems,
  linkCopied,
  onClose,
  onCopyJoinLink,
  onCopyAcademyLink,
  onLogout,
  user,
  academyPaymentStatus: _academyPaymentStatus,
}: MobileSidebarProps) {
  const pathname = usePathname();
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const renderIcon = (item: MenuItem) => {
    const iconMap: Record<string, JSX.Element> = {
      chart: <ChartNoAxesColumnIncreasingIcon size={20} />,
      book: <BookTextIcon size={20} />,
      userPlus: <UserRoundPlusIcon size={20} />,
      message: <MessageSquareMoreIcon size={20} />,
      clap: <ClapIcon size={20} />,
      fileText: <FileTextIcon size={20} />,
      clipboard: <ClipboardCheckIcon size={20} />,
      activity: <ActivityIcon size={20} />,
      users: <UsersIcon size={20} />,
      botMessage: <BotMessageSquareIcon size={20} />,
      handCoins: <HandCoinsIcon size={20} />,
      star: <PenToolIcon size={20} />,
      calendar: <CalendarDaysIcon size={20} />,
      folderOpen: <FolderOpenIcon size={20} />,
    };
    if (item.iconType && iconMap[item.iconType]) return iconMap[item.iconType];
    return item.icon ?? null;
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 bottom-0 w-72 bg-[#1a1d29] z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo & Close */}
        <div className="flex-shrink-0 h-16 flex items-center justify-between px-4 border-b border-gray-700/50">
          <Link
            href={`/dashboard/${role.toLowerCase()}`}
            className="flex items-center gap-2"
            onClick={onClose}
          >
            <Image
              src="/logo/AKADEMO_logo_OTHER2.svg"
              alt="Akademo"
              width={120}
              height={28}
              className="h-7 w-auto object-contain"
            />
            <span className="font-semibold text-gray-400 text-lg font-[family-name:var(--font-montserrat)]">
              AKADEMO
            </span>
          </Link>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-700/60 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex-1 min-h-0 px-3 py-4 overflow-y-auto">
          {(() => {
            const groups: { label: string | null; items: MenuItem[] }[] = [];
            for (const item of menuItems) {
              const g = item.group ?? null;
              const last = groups[groups.length - 1];
              if (!last || last.label !== g) groups.push({ label: g, items: [item] });
              else last.items.push(item);
            }
            return groups.map((group, gi) => {
              const isCollapsed = group.label ? collapsedGroups.has(group.label) : false;
              return (
                <div key={gi}>
                  {group.label && (
                    <button
                      onClick={() => toggleGroup(group.label!)}
                      className={`w-full flex items-center justify-between px-3 pb-1 text-[10px] font-semibold tracking-widest text-gray-500 hover:text-gray-300 uppercase transition-colors ${gi > 0 ? 'pt-4' : 'pt-1'}`}
                    >
                      <span>{group.label}</span>
                      <svg className={`w-3 h-3 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                  {!isCollapsed && (
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const isDashboardRoute = item.href === `/dashboard/${role.toLowerCase()}`;
                        const isActive = isDashboardRoute
                          ? pathname === item.href
                          : pathname === item.href || pathname.startsWith(item.href + '/');

                        const showPulse = item.showPulse === true;

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                              isActive
                                ? 'bg-gray-800/50 text-white'
                                : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                            }`}
                          >
                            {isActive && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#b1e787] rounded-r-full" />
                            )}
                            <span className={isActive ? 'text-[#b1e787]' : 'text-gray-400 group-hover:text-white'}>
                              {renderIcon(item)}
                            </span>
                            <span className="text-sm font-medium">{item.label}</span>
                            {showPulse && (
                              <span className="ml-auto w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                            )}
                            {!showPulse && item.badge !== undefined && item.badge > 0 && (
                              <span className={`ml-auto ${item.badgeColor || 'bg-[#b2e788]'} text-[#1a1c29] text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm`}>
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </nav>

        {/* Mobile User Profile */}
        <MobileSidebarBottom
          role={role}
          user={user}
          linkCopied={linkCopied}
          onClose={onClose}
          onCopyJoinLink={onCopyJoinLink}
          onCopyAcademyLink={onCopyAcademyLink}
          onLogout={onLogout}
        />
      </aside>
    </>
  );
}
