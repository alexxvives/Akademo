interface PricingSuccessContentProps {
  success: {
    title: string;
    subtitle: string;
    cta: string;
  };
}

export function PricingSuccessContent({ success }: PricingSuccessContentProps) {
  return (
    <section className="relative pt-40 pb-32 px-4 sm:px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 via-gray-950 to-gray-950 pointer-events-none" />
      <div className="relative max-w-lg mx-auto text-center">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
          <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">{success.title}</h1>
        <p className="text-lg text-gray-400 mb-10">{success.subtitle}</p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/25"
        >
          {success.cta}
        </a>
      </div>
    </section>
  );
}
