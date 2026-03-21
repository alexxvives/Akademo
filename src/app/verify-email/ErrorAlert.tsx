import Link from 'next/link';

interface ErrorAlertProps {
  error: string;
  joinUrl: string;
}

export function ErrorAlert({ error, joinUrl }: ErrorAlertProps) {
  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="flex-1">
          <p className="text-sm text-red-600 font-medium mb-2">{error}</p>
          {error.toLowerCase().includes('email') && !error.includes('código') && (
            <div className="mt-3 p-3 bg-white border border-red-200 rounded-lg">
              <p className="text-xs text-gray-700 font-semibold mb-2">¿Tu email rebotó o es incorrecto?</p>
              <p className="text-xs text-gray-600 mb-3">Si no puedes recibir emails en esta dirección, puedes regresar y usar un email diferente.</p>
              <Link 
                href={joinUrl}
                className="inline-flex items-center gap-1 text-xs font-medium text-red-700 hover:text-red-800 underline"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Actualizar dirección de email
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
