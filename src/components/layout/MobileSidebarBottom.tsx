'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { LinkIcon, LogoutIcon } from '@/components/ui';
import type { LinkIconHandle } from '@/components/ui/LinkIcon';
import type { LogoutIconHandle } from '@/components/ui/LogoutIcon';
import { usePeriod } from '@/contexts/PeriodContext';

interface MobileSidebarBottomProps {
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'ACADEMY';
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  linkCopied: boolean;
  onClose: () => void;
  onCopyJoinLink: () => void;
  onCopyAcademyLink: () => void;
  onLogout: () => void;
}

export function MobileSidebarBottom({
  role,
  user,
  linkCopied,
  onClose,
  onCopyJoinLink,
  onCopyAcademyLink,
  onLogout,
}: MobileSidebarBottomProps) {
  const linkIconRef = useRef<LinkIconHandle | null>(null);
  const logoutIconRef = useRef<LogoutIconHandle | null>(null);
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
  const { periods, activePeriodId, activePeriod, setActivePeriodId } = usePeriod();

  if (!user) return null;

  return (
    <div className="flex-shrink-0 border-t border-gray-700/50 p-4 bg-[#1a1d29]">
      {/* Period selector */}
      {(role === 'ACADEMY' || role === 'TEACHER') && periods.length > 0 && (
        <div className="mb-3 relative">
          <button
            onClick={() => setPeriodDropdownOpen(prev => !prev)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-gray-800/40 hover:bg-gray-700/50 text-gray-300 rounded-lg text-xs border border-gray-700/50 transition-colors"
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
            <div className="absolute bottom-full mb-1 left-0 right-0 bg-[#252836] border border-gray-700/50 rounded-lg shadow-lg overflow-hidden z-20">
              <div className="py-1">
                <button
                  onClick={() => { setActivePeriodId('all'); setPeriodDropdownOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${activePeriodId === 'all' ? 'text-white bg-gray-700/60 font-medium' : 'text-gray-400 hover:bg-gray-700/40'}`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${activePeriodId === 'all' ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="truncate flex-1 text-left">Todos los períodos</span>
                </button>
                {periods.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setActivePeriodId(p.id); setPeriodDropdownOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${activePeriodId === p.id ? 'text-white bg-gray-700/60 font-medium' : 'text-gray-400 hover:bg-gray-700/40'}`}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${activePeriodId === p.id ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="truncate flex-1 text-left">{p.name}</span>
                    {activePeriodId === p.id && <span className="text-[10px] text-[#b1e787] ml-auto flex-shrink-0">activo</span>}
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
            className="flex items-center gap-3 flex-1 min-w-0 hover:bg-gray-800/50 rounded-lg p-1.5 -m-1.5 transition-colors group"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full flex items-center justify-center text-sm font-medium text-gray-200 flex-shrink-0">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[11.4px] text-gray-400 truncate">{user.email}</p>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-3 flex-1 min-w-0 p-1.5 -m-1.5">
            <div className="w-9 h-9 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full flex items-center justify-center text-sm font-medium text-gray-200 flex-shrink-0">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[11.4px] text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        )}
        {(role === 'ACADEMY' || role === 'TEACHER') && (
          <button
            onClick={role === 'ACADEMY' ? onCopyAcademyLink : onCopyJoinLink}
            onMouseEnter={() => linkIconRef.current?.startAnimation()}
            onMouseLeave={() => linkIconRef.current?.stopAnimation()}
            title={linkCopied ? '¡Enlace copiado!' : 'Copiar enlace de invitación'}
            className={`p-1 rounded-lg flex-shrink-0 transition-colors ${linkCopied ? 'text-[#b1e787]' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}`}
          >
            <LinkIcon ref={linkIconRef} size={18} />
          </button>
        )}
      </div>
      <button
        onClick={onLogout}
        onMouseEnter={() => logoutIconRef.current?.startAnimation()}
        onMouseLeave={() => logoutIconRef.current?.stopAnimation()}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-400 hover:bg-gray-800/50 hover:text-white rounded-lg transition-colors"
      >
        <LogoutIcon ref={logoutIconRef} size={16} />
        Cerrar Sesión
      </button>
    </div>
  );
}
