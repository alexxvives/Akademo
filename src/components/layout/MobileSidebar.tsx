'use client';

import { useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LinkIcon, LogoutIcon } from '@/components/ui';

interface MenuItem {
  label: string;
  href: string;
  icon?: JSX.Element;
  iconType?: string;
  badge?: number;
  matchPaths?: string[];
}

interface MobileSidebarProps {
  isOpen: boolean;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'ACADEMY';
  menuItems: MenuItem[];
  activeStreams: any[];
  linkCopied: boolean;
  onClose: () => void;
  onCopyJoinLink: () => void;
  onSwitchRole: () => void;
  onLogout: () => void;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    monoacademy?: boolean;
  } | null;
}

export function MobileSidebar({
  isOpen,
  role,
  menuItems,
  activeStreams,
  linkCopied,
  onClose,
  onCopyJoinLink,
  onSwitchRole,
  onLogout,
  user,
}: MobileSidebarProps) {
  const pathname = usePathname();
  const linkIconRef = useRef<any>(null);
  const logoutIconRef = useRef<any>(null);

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
            <img
              src="/logo/AKADEMO_logo_OTHER2.svg"
              alt="Akademo"
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
        <nav className="px-3 py-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {menuItems.map((item) => {
            const isDashboardRoute = item.href === `/dashboard/${role.toLowerCase()}`;
            const isActive = isDashboardRoute
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/');

            const hasLiveStream = role === 'STUDENT' && item.label === 'Mis Clases' && activeStreams.length > 0;

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
                  {item.icon}
                </span>
                <span className="text-sm">{item.label}</span>
                {hasLiveStream && (
                  <span className="ml-auto w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                )}
                {!hasLiveStream && item.badge !== undefined && item.badge > 0 && (
                  <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
                    item.label === 'Solicitudes'
                      ? 'bg-blue-500 text-white'
                      : 'bg-brand-100 text-brand-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Teacher Invite Link */}
        {role === 'TEACHER' && user && (
          <div className="px-3 py-2">
            <button
              onClick={onCopyJoinLink}
              onMouseEnter={() => linkIconRef.current?.startAnimation()}
              onMouseLeave={() => linkIconRef.current?.stopAnimation()}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                linkCopied
                  ? 'bg-green-50 text-green-700'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <LinkIcon ref={linkIconRef} size={20} className="flex-shrink-0" />
              <span className="text-sm font-medium">
                {linkCopied ? '¡Enlace copiado!' : 'Copiar enlace de invitación'}
              </span>
            </button>
          </div>
        )}

        {/* Mobile User Profile */}
        {user && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4 bg-white">
            {/* Role Switcher (MonoAcademy) */}
            {user.monoacademy && (role === 'ACADEMY' || role === 'TEACHER') && (
              <button
                onClick={onSwitchRole}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-all mb-3"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span className="text-sm font-medium">
                  {role === 'ACADEMY' ? 'Cambiar a Profesor' : 'Cambiar a Academia'}
                </span>
              </button>
            )}

            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
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
