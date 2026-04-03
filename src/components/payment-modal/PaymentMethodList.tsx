interface PaymentMethodListProps {
  paymentFrequency: 'monthly' | 'one-time' | null;
  processing: boolean;
  allowedPaymentMethods: string[];
  transferenciaAvailable: boolean;
  bizumAvailable: boolean;
  transferenciaInfo: string;
  bizumInfo: string;
  copiedField: 'iban' | 'bizum' | null;
  copyToClipboard: (text: string, field: 'iban' | 'bizum') => void;
  currentPaymentStatus?: string;
  currentPaymentMethod?: string;
  handleStripePayment: () => void;
  handleTransferenciaPayment: () => void;
  handleBizumPayment: () => void;
  handleCashPayment: () => void;
}

export function PaymentMethodList({
  paymentFrequency,
  processing,
  allowedPaymentMethods,
  transferenciaAvailable,
  bizumAvailable,
  transferenciaInfo,
  bizumInfo,
  copiedField,
  copyToClipboard,
  currentPaymentStatus,
  currentPaymentMethod,
  handleStripePayment,
  handleTransferenciaPayment,
  handleBizumPayment,
  handleCashPayment,
}: PaymentMethodListProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        {!paymentFrequency
          ? 'Selecciona una modalidad primero'
          : 'Selecciona tu método de pago'}
      </h3>

      <div className="space-y-3">
        {/* Stripe Payment */}
        <button
          onClick={handleStripePayment}
          disabled={processing || !paymentFrequency || !allowedPaymentMethods.includes('stripe')}
          className={`w-full p-4 rounded-lg text-left transition-all ${
            !paymentFrequency || !allowedPaymentMethods.includes('stripe')
              ? 'bg-gray-50 border-2 border-gray-200 opacity-50 cursor-not-allowed'
              : 'bg-gray-50 border-2 border-gray-300 hover:border-gray-400 hover:shadow-md'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-base font-semibold text-gray-900 mb-0.5">Tarjeta de Crédito/Débito</h4>
              <p className="text-sm text-gray-600">Pago seguro con Stripe</p>
            </div>
            <div className="flex-shrink-0">
              {!allowedPaymentMethods.includes('stripe') ? (
                <span className="inline-block text-xs font-medium text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                  No disponible
                </span>
              ) : (
                <span className="inline-block text-xs font-medium text-white bg-violet-800 px-3 py-1 rounded-full">
                  Instantáneo
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Transferencia */}
        <div
          role="button"
          aria-label="Pagar con transferencia bancaria"
          tabIndex={!processing && !!paymentFrequency && transferenciaAvailable ? 0 : -1}
          onClick={!processing && !!paymentFrequency && transferenciaAvailable ? handleTransferenciaPayment : undefined}
          onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !processing && !!paymentFrequency && transferenciaAvailable) handleTransferenciaPayment(); }}
          className={`w-full p-4 rounded-lg text-left transition-all ${
            !paymentFrequency || !transferenciaAvailable
              ? 'bg-gray-50 border-2 border-gray-200 opacity-50 cursor-not-allowed'
              : 'bg-gray-50 border-2 border-gray-300 hover:border-gray-500 hover:shadow-md cursor-pointer'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-base font-semibold text-gray-900 mb-0.5">Transferencia Bancaria</h4>
              {transferenciaInfo ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-gray-700 text-sm tracking-wide select-all">
                    {transferenciaInfo}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(transferenciaInfo, 'iban'); }}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-[#1a1c29] transition-colors rounded"
                    title="Copiar IBAN"
                  >
                    {copiedField === 'iban' ? (
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">La academia aún no ha configurado su IBAN</p>
              )}
            </div>
            <div className="flex-shrink-0">
              {!transferenciaAvailable ? (
                <span className="inline-block text-xs font-medium text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                  No disponible
                </span>
              ) : currentPaymentStatus === 'PENDING' && currentPaymentMethod === 'transferencia' ? (
                <span className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-[#b0e788] text-[#1a1c29]">
                  Pendiente aprobación
                </span>
              ) : (
                <span className="inline-block text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  Requiere aprobación manual
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bizum */}
        <div
          role="button"
          aria-label="Pagar con Bizum"
          tabIndex={!processing && !!paymentFrequency && bizumAvailable ? 0 : -1}
          onClick={!processing && !!paymentFrequency && bizumAvailable ? handleBizumPayment : undefined}
          onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !processing && !!paymentFrequency && bizumAvailable) handleBizumPayment(); }}
          className={`w-full p-4 rounded-lg text-left transition-all ${
            !paymentFrequency || !bizumAvailable
              ? 'bg-gray-50 border-2 border-gray-200 opacity-50 cursor-not-allowed'
              : 'bg-gray-50 border-2 border-gray-300 hover:border-gray-400 hover:shadow-md cursor-pointer'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-base font-semibold text-gray-900 mb-0.5">Bizum</h4>
              {bizumInfo ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-gray-700 text-sm tracking-wide select-all">
                    {bizumInfo}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(bizumInfo, 'bizum'); }}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-[#1a1c29] transition-colors rounded"
                    title="Copiar número"
                  >
                    {copiedField === 'bizum' ? (
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">La academia aún no ha configurado su número</p>
              )}
            </div>
            <div className="flex-shrink-0">
              {!bizumAvailable ? (
                <span className="inline-block text-xs font-medium text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                  No disponible
                </span>
              ) : currentPaymentStatus === 'PENDING' && currentPaymentMethod === 'bizum' ? (
                <span className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-[#b0e788] text-[#1a1c29]">
                  Pendiente aprobación
                </span>
              ) : (
                <span className="inline-block text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  Requiere aprobación manual
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Cash Payment */}
        <button
          onClick={handleCashPayment}
          disabled={processing || !paymentFrequency || !allowedPaymentMethods.includes('cash')}
          className={`w-full p-4 rounded-lg text-left transition-all ${
            !paymentFrequency || !allowedPaymentMethods.includes('cash')
              ? 'bg-gray-50 border-2 border-gray-200 opacity-50 cursor-not-allowed'
              : 'bg-gray-50 border-2 border-gray-300 hover:border-gray-400 hover:shadow-md'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-base font-semibold text-gray-900 mb-0.5">Efectivo</h4>
              <p className="text-sm text-gray-600">Paga directamente en la academia</p>
            </div>
            <div className="flex-shrink-0">
              {!allowedPaymentMethods.includes('cash') ? (
                <span className="inline-block text-xs font-medium text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                  No disponible
                </span>
              ) : currentPaymentStatus === 'PENDING' && currentPaymentMethod === 'cash' ? (
                <span className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-[#b0e788] text-[#1a1c29]">
                  Pendiente aprobación
                </span>
              ) : (
                <span className="inline-block text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  Requiere aprobación manual
                </span>
              )}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
