interface CTASectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: Record<string, any>;
  onOpenModal: (mode: 'login' | 'register') => void;
}

export function CTASection({ t, onOpenModal }: CTASectionProps) {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 bg-blue-600">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          {t.ctaTitleBefore}
          <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent"
          >{t.ctaTitleHighlight}</span>
          {t.ctaTitleAfter}
        </h2>
        <p className="text-blue-100 text-lg mb-8">
          {t.ctaSubtitle}
        </p>
        <button
          onClick={() => onOpenModal('register')}
          className="px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-blue-50 font-semibold text-lg transition-all shadow-lg"
        >
          {t.ctaButton}
        </button>
      </div>
    </section>
  );
}
