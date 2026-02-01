'use client';

import { useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
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
import { useAcademyLogo } from '@/hooks/useAcademyLogo';

interface MenuItem {
  label: string;
  href: string;
  icon?: JSX.Element;
  iconType?: 'chart' | 'book' | 'userPlus' | 'message' | 'clap' | 'fileText' | 'clipboard' | 'activity' | 'users' | 'botMessage' | 'handCoins';
  badge?: number;
  badgeColor?: string;
  matchPaths?: string[];
}

interface SidebarProps {
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'ACADEMY';
  menuItems: MenuItem[];
  activeStreams: any[];
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
  academyPaymentStatus?: string;
}

export function Sidebar({
  role,
  menuItems,
  activeStreams,
  academyId,
  linkCopied,
  onCopyJoinLink,
  onCopyAcademyLink,
  onSwitchRole,
  onLogout,
  user,
  academyPaymentStatus,
}: SidebarProps) {
  const pathname = usePathname();
  const iconRefs = useRef<{ [key: string]: any }>({});
  const logoutIconRef = useRef<any>(null);
  const linkIconRef = useRef<any>(null);
  const { logoUrl, academyName, loading } = useAcademyLogo();

  const renderIcon = (item: MenuItem) => {
    const iconType = (item as any).iconType;
    
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
    } else if (item.icon) {
      return item.icon;
    }
    return null;
  };

  return (
    <aside className="hidden lg:flex flex-col bg-[#1a1d29] w-64 h-full">
      {/* Logo */}
      <div className="flex-shrink-0 h-20 flex items-center justify-center px-4 gap-2">
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-gray-700 animate-pulse rounded" />
            <div className="h-6 w-24 bg-gray-700 animate-pulse rounded" />
          </div>
        ) : (
          <Link href={`/dashboard/${role.toLowerCase()}`} className="flex items-center gap-2">
            {logoUrl ? (
              <>
                <img
                  src={`/api/storage/serve/${logoUrl}`}
                  alt="Academy Logo"
                  className="h-10 w-10 object-contain"
                  loading="eager"
                  fetchPriority="high"
                />
                {academyName && (
                  <span className="text-lg font-bold text-gray-400 font-[family-name:var(--font-montserrat)]">
                    {academyName}
                  </span>
                )}
              </>
            ) : (
              <>
                <img
                  src="/logo/AKADEMO_logo_OTHER2.svg"
                  alt="Akademo"
                  className="h-8 w-auto object-contain"
                />
                <span className="text-lg font-bold text-gray-400 font-[family-name:var(--font-montserrat)]">
                  AKADEMO
                </span>
              </>
            )}
          </Link>
        )}
      </div>

      {/* Scrollable content - navigation and buttons */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
        {/* Navigation */}
        <nav className="px-3 py-6 space-y-2">
          {menuItems.map((item) => {
            const isDashboardRoute = item.href === `/dashboard/${role.toLowerCase()}`;
            const matchesPath = (item as any).matchPaths && (item as any).matchPaths.some((p: string) => pathname.startsWith(p));
            const isActive = isDashboardRoute
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/') || matchesPath;

            const hasLiveStream = role === 'STUDENT' && item.label === 'Mis Asignaturas' && activeStreams.length > 0;
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
                {hasLiveStream && (
                  <span className="ml-auto w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                )}
                {!hasLiveStream && item.badge !== undefined && item.badge > 0 && (
                  <span className={`ml-auto ${item.badgeColor || 'bg-[#b2e788]'} text-[#1a1c29] text-xs font-bold px-2.5 py-1 rounded-full shadow-sm`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Fixed bottom section - always visible */}
      <div className="flex-shrink-0">
        {/* Quick Action Button - Above Role Switcher */}
        {role === 'STUDENT' && (
          <div className="px-3 py-2 border-t border-gray-800/50">
            <Link
              href="/dashboard/student/enrolled-academies/classes"
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

        {/* Academy Invite Link */}
        {role === 'ACADEMY' && academyId && (
          <div className="px-3 py-2 border-t border-gray-800/50">
            <button
              onClick={onCopyAcademyLink}
              onMouseEnter={() => {
                if (linkIconRef.current && typeof linkIconRef.current.startAnimation === 'function') {
                  linkIconRef.current.startAnimation();
                }
              }}
              onMouseLeave={() => {
                if (linkIconRef.current && typeof linkIconRef.current.stopAnimation === 'function') {
                  linkIconRef.current.stopAnimation();
                }
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                linkCopied
                  ? 'bg-[#b1e787]/20 text-[#b1e787]'
                  : 'bg-[#b1e787]/10 text-[#b1e787] hover:bg-[#b1e787]/20'
              }`}
            >
              <LinkIcon ref={linkIconRef} size={20} className="flex-shrink-0" />
              <span className="text-sm font-medium truncate">
                {linkCopied ? '¡Enlace copiado!' : 'Copiar enlace de invitación'}
              </span>
            </button>
          </div>
        )}

        {/* Teacher Invite Link */}
        {role === 'TEACHER' && user && (
          <div className="px-3 py-2 border-t border-gray-800/50">
            <button
              onClick={onCopyJoinLink}
              onMouseEnter={() => {
                if (linkIconRef.current && typeof linkIconRef.current.startAnimation === 'function') {
                  linkIconRef.current.startAnimation();
                }
              }}
              onMouseLeave={() => {
                if (linkIconRef.current && typeof linkIconRef.current.stopAnimation === 'function') {
                  linkIconRef.current.stopAnimation();
                }
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                linkCopied
                  ? 'bg-[#b1e787]/20 text-[#b1e787]'
                  : 'bg-[#b1e787]/10 text-[#b1e787] hover:bg-[#b1e787]/20'
              }`}
            >
              <LinkIcon ref={linkIconRef} size={20} className="flex-shrink-0" />
              <span className="text-sm font-medium truncate">
                {linkCopied ? '¡Enlace copiado!' : 'Copiar enlace de invitación'}
              </span>
            </button>
          </div>
        )}
        
        {/* User Profile */}
        {user && (
          <div className="border-t border-gray-800/50 p-4 pb-6">
          {role === 'ADMIN' ? (
            <div className="flex items-center gap-3 mb-3 p-2 -m-2">
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
            <Link
              href={`/dashboard/${role.toLowerCase()}/profile`}
              className="flex items-center gap-3 mb-3 cursor-pointer hover:bg-gray-800/30 rounded-xl p-2 -m-2 transition-colors group"
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
              <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
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
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-800/50 rounded-xl transition-colors"
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
