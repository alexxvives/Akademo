'use client';

import Image from 'next/image';
import { CctvIcon } from '@/components/icons/CctvIcon';
import type { ProfileState } from './useProfileData';
import type { ProfileConnections } from './useProfileConnections';

export function StreamingAccountsCard({ s, conn }: { s: ProfileState; conn: ProfileConnections }) {
  const { zoomAccounts, streamingDropdownOpen, setStreamingDropdownOpen, streamingDropdownRef, streamingIconRef, activePeriodId, isClassInPeriod } = s;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-12">
      <div className="px-4 sm:px-8 py-4 sm:py-6 bg-gray-900 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold">Cuentas de Streaming</h2>
            <p className="text-gray-300 mt-1">Gestiona tus cuentas de Zoom o GoToMeeting para clases en vivo</p>
          </div>
          <div ref={streamingDropdownRef} className="relative">
            <button type="button" className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              onClick={() => setStreamingDropdownOpen((o) => !o)}
              onMouseEnter={() => streamingIconRef.current?.startAnimation()}
              onMouseLeave={() => streamingIconRef.current?.stopAnimation()}>
              <CctvIcon ref={streamingIconRef} size={16} />
              Conectar cuenta
              <svg className="w-4 h-4 ml-1 transition-transform" style={{ transform: streamingDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {streamingDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-20 overflow-hidden">
                <button type="button" className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition" onClick={() => { conn.handleConnectZoom(); setStreamingDropdownOpen(false); }}>
                  <Image src="/images/zoom_logo.png" alt="Zoom" width={20} height={20} unoptimized className="w-5 h-5 object-contain" />Zoom
                </button>
                <div className="border-t border-gray-100" />
                <button type="button" className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition" onClick={() => { conn.handleConnectGTM(); setStreamingDropdownOpen(false); }}>
                  <Image src="/images/GTM_logo.png" alt="GoToMeeting" width={20} height={20} unoptimized className="w-5 h-5 object-contain" />GoToMeeting
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 py-4 sm:py-6">
        {zoomAccounts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </div>
            <p className="text-gray-900 font-medium">No hay cuentas conectadas</p>
            <p className="text-sm text-gray-500 mt-1">Conecta una cuenta de Zoom o GoToMeeting para crear clases en vivo</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {zoomAccounts.map(account => (
              <div key={account.id} className="group relative bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:border-brand-500 hover:shadow-lg transition-all">
                <button onClick={() => conn.handleDisconnectZoom(account.id)} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-red-600 hover:bg-red-50 rounded-lg z-10" title="Desconectar">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="flex items-start gap-4">
                  <div className="w-20 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 overflow-hidden p-2">
                    <Image src={account.provider === 'gotomeeting' ? '/images/GTM_logo.png' : '/images/zoom_logo.png'} alt={account.provider === 'gotomeeting' ? 'GoToMeeting' : 'Zoom'} width={80} height={48} unoptimized className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">{account.accountName}</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Activa</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">ID: {account.accountId}</p>
                    </div>
                    <p className="text-xs text-gray-500 pr-8">Conectado el {new Date(account.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="pt-3">
                  {account.classes && account.classes.length > 0 && (() => {
                    const visibleClasses = activePeriodId === 'all' ? account.classes : account.classes.filter(cls => cls.startDate ? isClassInPeriod(cls.startDate) : true);
                    if (visibleClasses.length === 0) return null;
                    return (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-700 mb-1">Clases asignadas:</p>
                        <div className="flex flex-wrap gap-1">
                          {visibleClasses.map((cls) => <span key={cls.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700">{cls.name}</span>)}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
        {zoomAccounts.length > 0 && (
          <div className="border-2 border-gray-900 rounded-lg p-4 mt-6">
            <p className="text-sm text-gray-900">Para asignar una cuenta de Streaming a una clase, ve a la{' '}<a href="/dashboard/academy/subjects" className="font-bold hover:text-gray-700">página de clases</a>{' '}y edita la clase correspondiente.</p>
          </div>
        )}
      </div>
    </div>
  );
}
