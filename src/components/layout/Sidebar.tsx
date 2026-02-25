'use client';

import { useRef, useState, type RefObject } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChartNoAxesColumnIncreasingIcon,
  BookTextIcon,
  UserRoundPlusIcon,
  MessageSquareMoreIcon,
  ClapIcon,
  FileTextIcon,
  ClipboardCheckIcon,
  ActivityIcon,
  LogoutIcon,
  LinkIcon,
} from '@/components/ui';
import { UsersIcon } from '@/components/ui/UsersIcon';
import { BotMessageSquareIcon } from '@/components/ui/BotMessageSquareIcon';
import { HandCoinsIcon } from '@/components/ui/HandCoinsIcon';
import { PenToolIcon, type PenToolIconHandle } from '@/components/ui/PenToolIcon';
import { HomeIcon, type HomeIconHandle } from '@/components/ui/HomeIcon';
import { CalendarDaysIcon } from '@/components/ui/CalendarDaysIcon';
import { useAcademyLogo } from '@/hooks/useAcademyLogo';
import { usePeriod } from '@/contexts/PeriodContext';

interface MenuItem {
  label: string;
  href: string;
  icon?: JSX.Element;
  iconType?: 'chart' | 'book' | 'userPlus' | 'message' | 'clap' | 'fileText' | 'clipboard' | 'activity' | 'users' | 'botMessage' | 'handCoins' | 'star' | 'calendar' | 'home';
  badge?: number;
  badgeColor?: string;
  matchPaths?: string[];
  showPulse?: boolean;
  group?: string;
}

interface IconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface SidebarProps {
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'ACADEMY';
  menuItems: MenuItem[];
  academyId: string | null;
  linkCopied: boolean;
  onCopyJoinLink: () => void;
  onCopyAcademyLink: () => void;
  onSwitchRole: () => void;
  onLogout: () => void;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    monoacademy?: boolean;
  } | null;
  academyPaymentStatus?: string | null;
  unreadCount?: number;
  onBellClick?: () => void;
}

export function Sidebar({
  role,
  menuItems,
  academyId,
  linkCopied,
  onCopyJoinLink,
  onCopyAcademyLink,
  onSwitchRole,
  onLogout,
  user,
  academyPaymentStatus,
  unreadCount = 0,
  onBellClick,
}: SidebarProps) {
  const pathname = usePathname();
  const iconRefs = useRef<Record<string, { current: IconHandle | null }>>({});
  const logoutIconRef = useRef<IconHandle | null>(null);
  const linkIconRef = useRef<IconHandle | null>(null);
  const { logoUrl, academyName, loading } = useAcademyLogo();
  const { periods, activePeriodId, activePeriod, setActivePeriodId } = usePeriod();
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
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
    const iconType = item.iconType;
    
    if (!iconRefs.current[item.href]) {
      iconRefs.current[item.href] = { current: null };
    }
    const iconRef = iconRefs.current[item.href];

    if (iconType === 'chart') {
      return <ChartNoAxesColumnIncreasingIcon ref={iconRef} size={20} />;
    } else if (iconType === 'book') {
      return <BookTextIcon ref={iconRef} size={20} />;
    } else if (iconType === 'userPlus') {
      return <UserRoundPlusIcon ref={iconRef} size={20} />;
    } else if (iconType === 'message') {
      return <MessageSquareMoreIcon ref={iconRef} size={20} />;
    } else if (iconType === 'clap') {
      return <ClapIcon ref={iconRef} size={20} />;
    } else if (iconType === 'fileText') {
      return <FileTextIcon ref={iconRef} size={20} />;
    } else if (iconType === 'clipboard') {
      return <ClipboardCheckIcon ref={iconRef} size={20} />;
    } else if (iconType === 'activity') {
      return <ActivityIcon ref={iconRef} size={20} />;
    } else if (iconType === 'users') {
      return <UsersIcon ref={iconRef} size={20} />;
    } else if (iconType === 'botMessage') {
      return <BotMessageSquareIcon ref={iconRef} size={20} />;
    } else if (iconType === 'handCoins') {
      return <HandCoinsIcon ref={iconRef} size={20} />;
    } else if (iconType === 'star') {
      return <PenToolIcon ref={iconRef as RefObject<PenToolIconHandle>} size={20} />;
    } else if (iconType === 'calendar') {
      return <CalendarDaysIcon ref={iconRef} size={20} />;
    } else if (iconType === 'home') {
      return <HomeIcon ref={iconRef as RefObject<HomeIconHandle>} size={20} />;
    } else if (item.icon) {
      return item.icon;
    }
    return null;
  };

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

      {/* Scrollable content - navigation and buttons */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
        {/* Navigation */}
        <nav className="px-3 pb-6">
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
                      className={`w-full flex items-center justify-between px-3 pb-1 text-[10px] font-semibold tracking-widest text-gray-500 hover:text-gray-300 uppercase transition-colors ${gi > 0 ? 'pt-5' : 'pt-0'}`}
                    >
                      <span>{group.label}</span>
                      <svg className={`w-3 h-3 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                  {!isCollapsed && (
                    <div className="space-y-0">
                      {group.items.map((item) => {
                        const isDashboardRoute = item.href === `/dashboard/${role.toLowerCase()}`;
                        const matchesPath = item.matchPaths?.some((p: string) => pathname.startsWith(p));
                        const isActive = isDashboardRoute
                          ? pathname === item.href
                          : pathname === item.href || pathname.startsWith(item.href + '/') || matchesPath;

                        const showPulse = item.showPulse === true;
                        const iconRef = iconRefs.current[item.href];

                        const handleMouseEnter = () => {
                          if (iconRef && iconRef.current && typeof iconRef.current.startAnimation === 'function') {
                            iconRef.current.startAnimation();
                          }
                        };

                        const handleMouseLeave = () => {
                          if (iconRef && iconRef.current && typeof iconRef.current.stopAnimation === 'function') {
                            iconRef.current.stopAnimation();
                          }
                        };

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${
                              isActive
                                ? 'bg-gray-800/50 text-white'
                                : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                            }`}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                          >
                            {isActive && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#b1e787] rounded-r-full" />
                            )}
                            <span className={`relative flex-shrink-0 ${
                              isActive ? 'text-[#b1e787]' : 'text-gray-400 group-hover:text-white'
                            }`}>
                              {renderIcon(item)}
                            </span>
                            <span className="text-sm font-medium">{item.label}</span>
                            {showPulse && (
                              <span className="ml-auto w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                            )}
                            {!showPulse && item.badge !== undefined && item.badge > 0 && (
                              <span className={`ml-auto ${item.badgeColor || 'bg-[#b2e788]'} text-[#1a1c29] text-xs font-bold px-2.5 py-1 rounded-full shadow-sm`}>
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
      </div>

      {/* Fixed bottom section - always visible */}
      <div className="flex-shrink-0">
        {/* Quick Action Button - Above Role Switcher */}
        {role === 'STUDENT' && (
          <div className="px-3 py-2 border-t border-gray-800/50">
            <button
              onClick={onBellClick}
              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-xl transition-all"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="text-sm font-medium">Notificaciones</span>
              </div>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        )}
        {role === 'STUDENT' && (
          <div className="px-3 py-2 border-t border-gray-800/50">
            <Link
              href="/dashboard/student/enrolled-academies/subjects"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#b1e787] hover:bg-[#9dd46f] text-gray-900 rounded-xl transition-all shadow-lg font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm">Explorar Clases</span>
            </Link>
          </div>
        )}

        {/* Role Switcher (MonoAcademy) */}
        {user?.monoacademy && (role === 'ACADEMY' || role === 'TEACHER') && (
          <div className="px-3 py-2 border-t border-gray-800/50">
            <button
              onClick={onSwitchRole}
              disabled={role === 'ACADEMY' && academyPaymentStatus === 'NOT PAID'}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                role === 'ACADEMY' && academyPaymentStatus === 'NOT PAID'
                  ? 'bg-gray-500/10 text-gray-500 cursor-not-allowed opacity-50'
                  : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'
              }`}
              title={role === 'ACADEMY' && academyPaymentStatus === 'NOT PAID' ? 'Debes pagar la suscripción para cambiar a profesor' : ''}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span className="text-sm font-medium">
                {role === 'ACADEMY' ? 'Cambiar a Profesor' : 'Cambiar a Academia'}
              </span>
            </button>
          </div>
        )}

        {/* User Profile */}
        {user && (
          <div className="border-t border-gray-800/50 p-4 pb-3">
          {/* Period selector embedded above profile */}
          {(role === 'ACADEMY' || role === 'TEACHER') && periods.length > 0 && (
            <div className="relative mb-3">
              <button
                onClick={() => setPeriodDropdownOpen(!periodDropdownOpen)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-gray-800/30 hover:bg-gray-800/50 text-gray-300 rounded-lg text-xs transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full flex-shrink-0 bg-green-400" />
                  <span className="truncate">
                    {activePeriodId === 'all' ? 'Todos los períodos' : (activePeriod?.name ?? 'Período activo')}
                  </span>
                </div>
                <svg className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${periodDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {periodDropdownOpen && (
                <div className="absolute bottom-full mb-1 left-0 right-0 bg-[#20243a] border border-gray-700 rounded-xl shadow-xl overflow-hidden z-10">
                  <div className="py-1">
                    <button
                      onClick={() => { setActivePeriodId('all'); setPeriodDropdownOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${activePeriodId === 'all' ? 'text-white bg-gray-700/50' : 'text-gray-400 hover:text-white hover:bg-gray-700/30'}`}
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${activePeriodId === 'all' ? 'bg-green-400' : 'bg-gray-500'}`} />
                      <span className="truncate flex-1 text-left">Todos los períodos</span>
                      {activePeriodId === 'all' && <span className="text-[10px] text-green-400 ml-auto flex-shrink-0">activo</span>}
                    </button>
                    {periods.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setActivePeriodId(p.id); setPeriodDropdownOpen(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${activePeriodId === p.id ? 'text-white bg-gray-700/50' : 'text-gray-400 hover:text-white hover:bg-gray-700/30'}`}
                      >
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${activePeriodId === p.id ? 'bg-green-400' : 'bg-gray-500'}`} />
                        <span className="truncate flex-1 text-left">{p.name}</span>
                        {activePeriodId === p.id && <span className="text-[10px] text-green-400 ml-auto flex-shrink-0">activo</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {role === 'ADMIN' ? (
            <div className="flex items-center gap-3 mb-1 p-2 -m-2">
              <div className="w-10 h-10 bg-[#b1e787] rounded-xl flex items-center justify-center text-sm font-bold text-gray-900 flex-shrink-0 shadow-lg">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1 mb-1 -mx-2">
              <Link
                href={`/dashboard/${role.toLowerCase()}/profile`}
                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:bg-gray-800/30 rounded-xl p-2 transition-colors group"
              >
                <div className="w-10 h-10 bg-[#b1e787] rounded-xl flex items-center justify-center text-sm font-bold text-gray-900 flex-shrink-0 shadow-lg">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
              </Link>
              {(role === 'ACADEMY' || role === 'TEACHER') && (
                <button
                  onClick={role === 'ACADEMY' ? onCopyAcademyLink : onCopyJoinLink}
                  onMouseEnter={() => { if (linkIconRef.current && typeof linkIconRef.current.startAnimation === 'function') linkIconRef.current.startAnimation(); }}
                  onMouseLeave={() => { if (linkIconRef.current && typeof linkIconRef.current.stopAnimation === 'function') linkIconRef.current.stopAnimation(); }}
                  title={linkCopied ? '¡Enlace copiado!' : 'Copiar enlace de invitación'}
                  className={`p-2 rounded-xl flex-shrink-0 transition-colors ${linkCopied ? 'text-[#b1e787]' : 'text-gray-500 hover:text-white hover:bg-gray-800/50'}`}
                >
                  <LinkIcon ref={linkIconRef} size={18} />
                </button>
              )}
            </div>
          )}
          <button
            onClick={onLogout}
            onMouseEnter={() => {
              if (logoutIconRef.current && typeof logoutIconRef.current.startAnimation === 'function') {
                logoutIconRef.current.startAnimation();
              }
            }}
            onMouseLeave={() => {
              if (logoutIconRef.current && typeof logoutIconRef.current.stopAnimation === 'function') {
                logoutIconRef.current.stopAnimation();
              }
            }}
            className="mt-1 w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-800/50 rounded-xl transition-colors"
          >
            <LogoutIcon ref={logoutIconRef} size={16} />
            Cerrar Sesión
          </button>
        </div>
      )}
      </div>
    </aside>
  );
}
