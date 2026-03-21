export function ShieldAnimationOverlay() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-10 bg-gradient-to-b from-brand-900/90 to-gray-900/90"
      style={{ animation: 'fadeOut 1.5s ease-in-out forwards' }}
    >
      <div className="text-center">
        {/* Animated Shield */}
        <div className="relative w-32 h-32 mx-auto mb-6 animate-pulse">
          <svg
            viewBox="0 0 24 24"
            className="w-full h-full text-green-400"
            style={{ animation: 'scaleIn 0.8s ease-out forwards' }}
          >
            <defs>
              <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#16a34a" />
              </linearGradient>
            </defs>
            <path
              fill="url(#shieldGradient)"
              d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Protegiendo tu Acceso</h2>
        <p className="text-gray-300">Documento de consentimiento requerido</p>
      </div>
    </div>
  );
}

export function DocumentSigningAnimationStyles() {
  return (
    <style>{`
      @keyframes fadeOut {
        0% { opacity: 1; }
        70% { opacity: 1; }
        100% { opacity: 0; pointer-events: none; }
      }
      @keyframes scaleIn {
        0% { transform: scale(0.5); opacity: 0; }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes slideUp {
        0% { transform: translateY(20px); opacity: 0; }
        100% { transform: translateY(0); opacity: 1; }
      }
      .animate-slideUp {
        animation: slideUp 0.5s ease-out forwards;
      }
    `}</style>
  );
}
