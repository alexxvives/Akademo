'use client';

interface StripeConnectButtonProps {
  onClick: () => void;
}

/**
 * Stripe Connect Button Component
 * Used in academy profile page to initiate Stripe Connect OAuth flow
 */
export function StripeConnectButton({ onClick }: StripeConnectButtonProps) {
  return (
    <button
      type="button"
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors shadow-sm border border-indigo-200"
      onClick={onClick}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
      Conectar Stripe
    </button>
  );
}
