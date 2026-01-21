'use client';

export default function FacturasPage() {
  const handleCheckout = () => {
    // Redirect directly to Stripe payment link
    window.location.href = 'https://buy.stripe.com/test_7sYcN55YBghq2MP5YD9bO00';
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Facturas y Pagos</h1>
      </div>

      <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Suscripción Premium</h2>
        <p className="text-gray-600 mb-6">
          Actualiza a nuestra suscripción premium para acceder a funciones avanzadas.
        </p>

        <div className="bg-gray-50 rounded-lg p-6 mb-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Plan Mensual</h3>
          <p className="text-3xl font-bold text-gray-900 mb-4">
            $9.99<span className="text-base font-normal text-gray-600">/mes</span>
          </p>
          <ul className="space-y-2 text-gray-600 mb-6 text-left inline-block">
            <li className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Clases ilimitadas
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Estudiantes ilimitados
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Soporte prioritario
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Análisis avanzados
            </li>
          </ul>
        </div>

        <button
          onClick={handleCheckout}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          Proceder al Pago
        </button>

        <p className="text-sm text-gray-500 mt-4 text-center">
          Procesado de forma segura por Stripe
        </p>
      </div>
    </div>
  );
}
