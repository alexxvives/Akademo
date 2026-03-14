'use client';

import { useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LinkIcon, LogoutIcon, ChartNoAxesColumnIncreasingIcon, BookTextIcon, UserRoundPlusIcon, MessageSquareMoreIcon, ClapIcon, FileTextIcon, ClipboardCheckIcon, ActivityIcon } from '@/components/ui';
import { UsersIcon } from '@/components/ui/UsersIcon';
import { BotMessageSquareIcon } from '@/components/ui/BotMessageSquareIcon';
import { HandCoinsIcon } from '@/components/ui/HandCoinsIcon';
import { PenToolIcon } from '@/components/ui/PenToolIcon';
import { CalendarDaysIcon } from '@/components/ui/CalendarDaysIcon';
import type { LinkIconHandle } from '@/components/ui/LinkIcon';
import type { LogoutIconHandle } from '@/components/ui/LogoutIcon';
import { usePeriod } from '@/contexts/PeriodContext';

interface MenuItem {
  label: string;
  href: string;
  icon?: JSX.Element;
  iconType?: string;
  badge?: number;
  badgeColor?: string;
  matchPaths?: string[];
  showPulse?: boolean;
  group?: string;
}

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
  const linkIconRef = useRef<LinkIconHandle | null>(null);
  const logoutIconRef = useRef<LogoutIconHandle | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
  const { periods, activePeriodId, activePeriod, setActivePeriodId } = usePeriod();
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
        className={`lg:hidden fixed top-0 left-0 bottom-0 w-72 bg-white z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo & Close */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
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
            <span className="font-semibold text-gray-900 text-lg font-[family-name:var(--font-montserrat)]">
              AKADEMO
            </span>
          </Link>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="px-3 py-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
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
                      className={`w-full flex items-center justify-between px-3 pb-1 text-[10px] font-semibold tracking-widest text-gray-400 hover:text-gray-600 uppercase transition-colors ${gi > 0 ? 'pt-4' : 'pt-1'}`}
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
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                              isActive
                                ? 'bg-brand-50 text-brand-700 font-medium shadow-sm'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <span className={isActive ? 'text-brand-600' : 'text-gray-500'}>
                              {renderIcon(item)}
                            </span>
                            <span className="text-sm">{item.label}</span>
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
        {user && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4 bg-white">
            {/* Period selector */}
            {(role === 'ACADEMY' || role === 'TEACHER') && periods.length > 0 && (
              <div className="mb-3 relative">
                <button
                  onClick={() => setPeriodDropdownOpen(prev => !prev)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs border border-gray-200 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full flex-shrink-0 bg-green-500" />
                    <span className="truncate">
                      {activePeriodId === 'all' ? 'Todos los períodos' : (activePeriod?.name ?? 'Período activo')}
                    </span>
                  </div>
                  <svg className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${periodDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {periodDropdownOpen && (
                  <div className="absolute bottom-full mb-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-20">
                    <div className="py-1">
                      <button
                        onClick={() => { setActivePeriodId('all'); setPeriodDropdownOpen(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${activePeriodId === 'all' ? 'text-gray-900 bg-gray-100 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${activePeriodId === 'all' ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className="truncate flex-1 text-left">Todos los períodos</span>
                      </button>
                      {periods.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => { setActivePeriodId(p.id); setPeriodDropdownOpen(false); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${activePeriodId === p.id ? 'text-gray-900 bg-gray-100 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${activePeriodId === p.id ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <span className="truncate flex-1 text-left">{p.name}</span>
                          {activePeriodId === p.id && <span className="text-[10px] text-green-600 ml-auto flex-shrink-0">activo</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-1 mb-3">
              {role !== 'ADMIN' ? (
                <Link
                  href={`/dashboard/${role.toLowerCase()}/profile`}
                  onClick={onClose}
                  className="flex items-center gap-3 flex-1 min-w-0 hover:bg-gray-50 rounded-lg p-1.5 -m-1.5 transition-colors group"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-700 flex-shrink-0">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center gap-3 flex-1 min-w-0 p-1.5 -m-1.5">
                  <div className="w-9 h-9 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-700 flex-shrink-0">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
              )}
              {(role === 'ACADEMY' || role === 'TEACHER') && (
                <button
                  onClick={role === 'ACADEMY' ? onCopyAcademyLink : onCopyJoinLink}
                  onMouseEnter={() => linkIconRef.current?.startAnimation()}
                  onMouseLeave={() => linkIconRef.current?.stopAnimation()}
                  title={linkCopied ? '¡Enlace copiado!' : 'Copiar enlace de invitación'}
                  className={`p-2 rounded-lg flex-shrink-0 transition-colors ${linkCopied ? 'text-green-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                >
                  <LinkIcon ref={linkIconRef} size={18} />
                </button>
              )}
            </div>
            <button
              onClick={onLogout}
              onMouseEnter={() => logoutIconRef.current?.startAnimation()}
              onMouseLeave={() => logoutIconRef.current?.stopAnimation()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <LogoutIcon ref={logoutIconRef} size={16} />
              Cerrar Sesión
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
