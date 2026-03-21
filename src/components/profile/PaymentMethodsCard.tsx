'use client';

import { formatSpanishIbanInput, formatSpanishBizumPhone } from './profile-types';
import type { ProfileState } from './useProfileData';
import type { ProfileActions } from './useProfileActions';

export function PaymentMethodsCard({ s, actions }: { s: ProfileState; actions: ProfileActions }) {
  const { formData, setFormData, stripeStatus, expandedPaymentMethod, setExpandedPaymentMethod, academy } = s;
  const isTransferenciaExpanded = expandedPaymentMethod === 'transferencia';
  const isBizumExpanded = expandedPaymentMethod === 'bizum';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-8 py-5 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Métodos de Pago Permitidos</h3>
            <p className="text-sm text-gray-600">Selecciona los métodos de pago que aceptará tu academia</p>
          </div>
          {formData.allowedPaymentMethods.length === 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
              <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              <p className="text-sm text-red-800 font-medium">Debes seleccionar al menos un método de pago</p>
            </div>
          )}
        </div>
      </div>
      <div className="px-4 sm:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {/* Stripe */}
          <div role={stripeStatus?.charges_enabled ? 'button' : undefined} tabIndex={stripeStatus?.charges_enabled ? 0 : -1}
            onClick={stripeStatus?.charges_enabled ? () => actions.toggleAllowedPaymentMethod('stripe') : undefined}
            onKeyDown={stripeStatus?.charges_enabled ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); void actions.toggleAllowedPaymentMethod('stripe'); } } : undefined}
            className={`p-4 border-2 rounded-xl transition-all duration-200 ${!stripeStatus?.charges_enabled ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed' : formData.allowedPaymentMethods.includes('stripe') ? 'border-violet-500 bg-violet-50 shadow-md cursor-pointer' : 'border-gray-200 bg-white cursor-pointer'}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className={`text-sm font-semibold mb-1 ${formData.allowedPaymentMethods.includes('stripe') ? 'text-violet-900' : 'text-gray-900'}`}>Stripe</div>
                <p className={`text-xs ${formData.allowedPaymentMethods.includes('stripe') ? 'text-violet-700' : 'text-gray-500'}`}>Tarjetas de crédito y débito</p>
              </div>
              <div className={`mt-0.5 h-3 w-3 rounded-full ${formData.allowedPaymentMethods.includes('stripe') ? 'bg-violet-500' : 'bg-gray-300'}`} />
            </div>
          </div>

          {/* Cash */}
          <div role="button" tabIndex={0} onClick={() => actions.toggleAllowedPaymentMethod('cash')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); void actions.toggleAllowedPaymentMethod('cash'); } }}
            className={`p-4 border-2 rounded-xl transition-all duration-200 cursor-pointer ${formData.allowedPaymentMethods.includes('cash') ? 'border-green-500 bg-green-50 shadow-md' : 'border-gray-200 bg-white'}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className={`text-sm font-semibold mb-1 ${formData.allowedPaymentMethods.includes('cash') ? 'text-green-900' : 'text-gray-900'}`}>Efectivo</div>
                <p className={`text-xs ${formData.allowedPaymentMethods.includes('cash') ? 'text-green-700' : 'text-gray-500'}`}>Pago en persona en la academia</p>
              </div>
              <div className={`mt-0.5 h-3 w-3 rounded-full ${formData.allowedPaymentMethods.includes('cash') ? 'bg-green-500' : 'bg-gray-300'}`} />
            </div>
          </div>

          {/* Transferencia */}
          <div>
            <div role="button" tabIndex={0} onClick={() => actions.toggleAllowedPaymentMethod('transferencia')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); void actions.toggleAllowedPaymentMethod('transferencia'); } }}
              className={`p-4 border-2 rounded-xl transition-all duration-200 cursor-pointer ${formData.allowedPaymentMethods.includes('transferencia') ? 'border-gray-500 bg-gray-50 shadow-md' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><div className="text-sm font-semibold mb-1 text-gray-900">Transferencia</div><p className="text-xs text-gray-600">Transferencia a la academia</p></div>
                <div className={`mt-0.5 h-3 w-3 rounded-full ${formData.allowedPaymentMethods.includes('transferencia') ? 'bg-gray-500' : 'bg-gray-300'}`} />
              </div>
            </div>
            {isTransferenciaExpanded && (
              <div className="mt-2 flex gap-2 items-stretch">
                <input type="text" value={formData.transferenciaIban} onChange={(e) => setFormData({ ...formData, transferenciaIban: formatSpanishIbanInput(e.target.value) })}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void actions.saveTransferenciaSetup(); } if (e.key === 'Escape') { e.preventDefault(); setExpandedPaymentMethod(null); setFormData((c) => ({ ...c, transferenciaIban: academy?.transferenciaIban || 'ES' })); } }}
                  placeholder="ES12 1234 1234 12 1234567890" className="flex-1 min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200" maxLength={29} autoFocus />
                <button type="button" onClick={() => void actions.saveTransferenciaSetup()} className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors flex-shrink-0">OK</button>
              </div>
            )}
          </div>

          {/* Bizum */}
          <div>
            <div role="button" tabIndex={0} onClick={() => actions.toggleAllowedPaymentMethod('bizum')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); void actions.toggleAllowedPaymentMethod('bizum'); } }}
              className={`p-4 border-2 rounded-xl transition-all duration-200 cursor-pointer ${formData.allowedPaymentMethods.includes('bizum') ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className={`text-sm font-semibold mb-1 ${formData.allowedPaymentMethods.includes('bizum') ? 'text-blue-900' : 'text-gray-900'}`}>Bizum</div>
                  <p className={`text-xs ${formData.allowedPaymentMethods.includes('bizum') ? 'text-blue-700' : 'text-gray-500'}`}>Bizum a la academia</p>
                </div>
                <div className={`mt-0.5 h-3 w-3 rounded-full ${formData.allowedPaymentMethods.includes('bizum') ? 'bg-blue-500' : 'bg-gray-300'}`} />
              </div>
            </div>
            {isBizumExpanded && (
              <div className="mt-2 flex gap-2 items-stretch">
                <input type="tel" value={formData.bizumPhone} onChange={(e) => setFormData({ ...formData, bizumPhone: formatSpanishBizumPhone(e.target.value) })}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void actions.saveBizumSetup(); } if (e.key === 'Escape') { e.preventDefault(); setExpandedPaymentMethod(null); setFormData((c) => ({ ...c, bizumPhone: academy?.bizumPhone || '' })); } }}
                  placeholder="+34 600 123 456" className="flex-1 min-w-0 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" maxLength={15} autoFocus />
                <button type="button" onClick={() => void actions.saveBizumSetup()} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors flex-shrink-0">OK</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
