interface PaymentHeaderProps {
  className: string;
  academyName: string;
  onClose: () => void;
}

export function PaymentHeader({ className, academyName, onClose }: PaymentHeaderProps) {
  return (
    <div className="p-4 sm:p-6 border-b border-gray-200 bg-[#1a1c29] relative shrink-0">
      <div className="text-center pr-10 sm:pr-0">
        <h2 className="text-lg sm:text-2xl font-bold text-[#b1e787] leading-tight">{className}</h2>
        <p className="text-sm sm:text-base text-[#b1e787]/80 mt-1 flex items-center justify-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span className="truncate">{academyName}</span>
        </p>
      </div>
      <button
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute top-3 right-3 sm:top-6 sm:right-6 p-2 hover:bg-white/10 rounded-lg transition-colors"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#b1e787]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
