'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { LogoutIcon, LinkIcon } from '@/components/ui';
import { usePeriod } from '@/contexts/PeriodContext';
import type { IconHandle } from './SidebarTypes';

interface SidebarBottomProps {
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'ACADEMY';
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  linkCopied: boolean;
  onCopyJoinLink: () => void;
  onCopyAcademyLink: () => void;
  onLogout: () => void;
  collapsed?: boolean;
}

export function SidebarBottom({
  role,
  user,
  linkCopied,
  onCopyJoinLink,
  onCopyAcademyLink,
  onLogout,
  collapsed = false,
}: SidebarBottomProps) {
  const logoutIconRef = useRef<IconHandle | null>(null);
  const linkIconRef = useRef<IconHandle | null>(null);
  const { periods, activePeriodId, activePeriod, setActivePeriodId } = usePeriod();
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);

  if (collapsed) {
    return (
      <div className="flex-shrink-0 border-t border-gray-800/50">
        {role === 'STUDENT' && (
          <div className="py-2 flex justify-center">
            <Link
              href="/dashboard/student/enrolled-academies/subjects"
              title="Explorar Clases"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#b1e787] hover:bg-[#9dd46f] text-gray-900 transition-colors shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Link>
          </div>
        )}
        {user && (
          <div className="flex flex-col items-center gap-1 py-3">
            {role !== 'ADMIN' ? (
              <Link
                href={`/dashboard/${role.toLowerCase()}/profile`}
                title={`${user.firstName} ${user.lastName}`}
                className="w-8 h-8 bg-[#b1e787] hover:bg-[#9dd46f] rounded-xl flex items-center justify-center text-xs font-bold text-gray-900 flex-shrink-0 shadow-lg transition-colors"
              >
                {user.firstName[0]}{user.lastName[0]}
              </Link>
            ) : (
              <div
                title={`${user.firstName} ${user.lastName}`}
                className="w-8 h-8 bg-[#b1e787] rounded-xl flex items-center justify-center text-xs font-bold text-gray-900 flex-shrink-0 shadow-lg"
              >
                {user.firstName[0]}{user.lastName[0]}
              </div>
            )}
            <button
              onClick={onLogout}
              title="Cerrar Sesión"
              className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:text-white hover:bg-gray-800/50 transition-colors"
            >
              <LogoutIcon ref={logoutIconRef} size={16} />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-shrink-0">
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

      {user && (
        <div className="border-t border-gray-800/50 p-4 pb-3">
          {/* Period selector */}
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

          {/* User profile */}
          {role === 'ADMIN' ? (
            <div className="flex items-center gap-3 mb-1 p-2 -m-2">
              <div className="w-8 h-8 bg-[#b1e787] rounded-xl flex items-center justify-center text-xs font-bold text-gray-900 flex-shrink-0 shadow-lg">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-[11.4px] text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1 mb-1 -mx-2">
              <Link
                href={`/dashboard/${role.toLowerCase()}/profile`}
                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:bg-gray-800/30 rounded-xl p-2 transition-colors group"
              >
                <div className="w-8 h-8 bg-[#b1e787] rounded-xl flex items-center justify-center text-xs font-bold text-gray-900 flex-shrink-0 shadow-lg">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-[11.4px] text-gray-400 truncate">{user.email}</p>
                </div>
              </Link>
              {(role === 'ACADEMY' || role === 'TEACHER') && (
                <button
                  onClick={role === 'ACADEMY' ? onCopyAcademyLink : onCopyJoinLink}
                  onMouseEnter={() => { if (linkIconRef.current && typeof linkIconRef.current.startAnimation === 'function') linkIconRef.current.startAnimation(); }}
                  onMouseLeave={() => { if (linkIconRef.current && typeof linkIconRef.current.stopAnimation === 'function') linkIconRef.current.stopAnimation(); }}
                  title={linkCopied ? '¡Enlace copiado!' : 'Copiar enlace de invitación'}
                  className={`p-1 rounded-xl flex-shrink-0 transition-colors ${linkCopied ? 'text-[#b1e787]' : 'text-gray-500 hover:text-white hover:bg-gray-800/50'}`}
                >
                  <LinkIcon ref={linkIconRef} size={18} />
                </button>
              )}
            </div>
          )}

          {/* Logout */}
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
  );
}
