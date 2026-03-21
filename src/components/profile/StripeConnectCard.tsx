'use client';

import Image from 'next/image';
import { StripeConnectButton } from '@/components/profile';
import type { ProfileState } from './useProfileData';
import type { ProfileConnections } from './useProfileConnections';

export function StripeConnectCard({ s, conn }: { s: ProfileState; conn: ProfileConnections }) {
  const { stripeStatus } = s;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-12">
      <div className="px-4 sm:px-8 py-4 sm:py-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold">Cuenta de Stripe</h2>
            <p className="text-indigo-100 mt-1">Recibe pagos de estudiantes directamente en tu cuenta bancaria</p>
          </div>
          {!stripeStatus?.charges_enabled && (
            <StripeConnectButton onClick={conn.handleConnectStripe} label={stripeStatus?.connected ? 'Completar verificación' : 'Conectar Stripe'} />
          )}
        </div>
      </div>

      <div className="px-4 sm:px-8 py-4 sm:py-6">
        {!stripeStatus?.connected ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            </div>
            <p className="text-gray-900 font-medium mb-2">Cuenta no conectada</p>
            <p className="text-sm text-gray-500 max-w-md mx-auto">Conecta tu cuenta de Stripe para recibir pagos de estudiantes directamente en tu cuenta bancaria. Los estudiantes podrán pagar con tarjeta, transferencia bancaria o Transferencia.</p>
          </div>
        ) : stripeStatus.charges_enabled ? (
          <>
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 hover:border-brand-500 hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 overflow-hidden">
                  <Image src="/images/Stripe_logo.svg" alt="Stripe" width={56} height={56} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 truncate">{stripeStatus.email || 'Cuenta de Stripe'}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Activa</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">ID: {stripeStatus.accountId}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-gray-500">Conectado</p>
                    <button onClick={conn.handleDisconnectStripe} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Desconectar Stripe">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-2 border-gray-900 rounded-lg p-4 mt-6">
              <p className="text-sm text-gray-900"><strong>Comisión de plataforma:</strong> Stripe cobra una comisión del 2.9% sobre cada pago.</p>
            </div>
          </>
        ) : (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-indigo-900 mb-2">Verificación pendiente</h3>
                <p className="text-indigo-700 text-sm mb-4">Necesitas completar el proceso de verificación en Stripe para poder cobrar pagos. Haz clic en el botón de arriba para continuar.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
