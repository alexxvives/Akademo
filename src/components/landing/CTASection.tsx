interface CTASectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: Record<string, any>;
  onOpenModal: (mode: 'login' | 'register') => void;
}

export function CTASection({ t, onOpenModal }: CTASectionProps) {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-3xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          {t.ctaTitleBefore}
          <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent"
          >{t.ctaTitleHighlight}</span>
          {t.ctaTitleAfter}
        </h2>
        <p className="text-gray-400 text-lg mb-8">
          {t.ctaSubtitle}
        </p>
        <button
          onClick={() => onOpenModal('register')}
          className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl hover:from-emerald-400 hover:to-cyan-400 font-semibold text-lg transition-all shadow-lg shadow-emerald-500/25"
        >
          {t.ctaButton}
        </button>
      </div>
    </section>
  );
}
