import { formatPrice } from './types';

interface FrequencySelectorProps {
  hasMonthly: boolean;
  hasOneTime: boolean;
  paymentFrequency: 'monthly' | 'one-time' | null;
  setPaymentFrequency: (f: 'monthly' | 'one-time') => void;
  monthlyPrice?: number | null;
  oneTimePrice?: number | null;
  currency: string;
  missedCycles?: number;
  firstPaymentAmount?: number;
}

export function FrequencySelector({
  hasMonthly,
  hasOneTime,
  paymentFrequency,
  setPaymentFrequency,
  monthlyPrice,
  oneTimePrice,
  currency,
  missedCycles,
  firstPaymentAmount,
}: FrequencySelectorProps) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Selecciona tu modalidad de pago</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Monthly Card */}
        <button
          onClick={() => hasMonthly && setPaymentFrequency('monthly')}
          disabled={!hasMonthly}
          className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
            !hasMonthly
              ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
              : paymentFrequency === 'monthly'
              ? 'border-[#b0e788] bg-[#b0e788]/10 shadow-md'
              : 'border-gray-200 bg-white hover:border-[#b0e788]/50 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className={`text-base font-semibold mb-1 ${!hasMonthly ? 'text-gray-400' : 'text-[#1a1c29]'}`}>
                Pago Mensual
              </h4>
              {missedCycles && missedCycles > 1 ? (
                <div>
                  <span className={`text-xl font-bold ${!hasMonthly ? 'text-gray-400' : paymentFrequency === 'monthly' ? 'text-[#1a1c29]' : 'text-gray-700'}`}>
                    {hasMonthly && firstPaymentAmount ? formatPrice(firstPaymentAmount, currency) : 'No disponible'}
                  </span>
                  <p className="text-xs text-gray-600 mt-1">
                    ({missedCycles} meses × {formatPrice(monthlyPrice || 0, currency)})
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Luego {formatPrice(monthlyPrice || 0, currency)}/mes
                  </p>
                </div>
              ) : (
                <span className={`text-xl font-bold ${!hasMonthly ? 'text-gray-400' : paymentFrequency === 'monthly' ? 'text-[#1a1c29]' : 'text-gray-700'}`}>
                  {hasMonthly ? formatPrice(monthlyPrice || 0, currency) : 'No disponible'}
                </span>
              )}
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              !hasMonthly
                ? 'border-gray-300 bg-gray-200'
                : paymentFrequency === 'monthly' 
                ? 'border-[#b0e788] bg-[#b0e788]' 
                : 'border-gray-300'
            }`}>
              {paymentFrequency === 'monthly' && hasMonthly && (
                <svg className="w-3 h-3 text-[#1a1c29]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
        </button>

        {/* One-Time Card */}
        <button
          onClick={() => hasOneTime && setPaymentFrequency('one-time')}
          disabled={!hasOneTime}
          className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
            !hasOneTime
              ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
              : paymentFrequency === 'one-time'
              ? 'border-[#b0e788] bg-[#b0e788]/10 shadow-md'
              : 'border-gray-200 bg-white hover:border-[#b0e788]/50 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className={`text-base font-semibold mb-1 ${!hasOneTime ? 'text-gray-400' : 'text-[#1a1c29]'}`}>
                Pago Único
              </h4>
              <span className={`text-xl font-bold ${!hasOneTime ? 'text-gray-400' : paymentFrequency === 'one-time' ? 'text-[#1a1c29]' : 'text-gray-700'}`}>
                {hasOneTime ? formatPrice(oneTimePrice || 0, currency) : 'No disponible'}
              </span>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              !hasOneTime
                ? 'border-gray-300 bg-gray-200'
                : paymentFrequency === 'one-time' 
                ? 'border-[#b0e788] bg-[#b0e788]' 
                : 'border-gray-300'
            }`}>
              {paymentFrequency === 'one-time' && hasOneTime && (
                <svg className="w-3 h-3 text-[#1a1c29]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
