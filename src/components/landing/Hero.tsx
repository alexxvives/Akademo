'use client';

interface HeroTranslations {
  heroBadge: string;
  heroTitle1: string;
  heroTitle2: string;
  heroSubtitle: string;
  startFree: string;
  signIn: string;
}

interface HeroProps {
  t: HeroTranslations;
  isScrolled: boolean;
  onOpenModal: (mode: 'login' | 'register') => void;
}

export function Hero({ t, isScrolled: _isScrolled, onOpenModal }: HeroProps) {
  return (
    <section 
      className="relative min-h-screen flex items-center justify-center px-4 sm:px-6"
      style={{
        backgroundImage: 'url(/hero-bg_mobile.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <style jsx>{`
        @media (min-width: 768px) {
          section {
            background-image: url(/hero-bg.webp) !important;
          }
        }
      `}</style>
      
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
      
      <div className="relative max-w-4xl mx-auto text-center pt-24 sm:pt-20 px-2">
        <p className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-md rounded-full text-white/90 text-xs sm:text-sm font-medium mb-6 sm:mb-8 border border-white/20">
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          {t.heroBadge}
        </p>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-[1.15] sm:leading-tight tracking-tight px-2">
          {t.heroTitle1}
          <br />
          <span className="italic font-light">{t.heroTitle2}</span>
        </h1>
        <p className="text-base sm:text-lg lg:text-xl text-white/90 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-2">
          {t.heroSubtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center px-4">
          <button
            onClick={() => onOpenModal('register')}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-white text-gray-900 rounded-xl hover:bg-white/90 font-medium text-sm sm:text-base transition-all shadow-lg"
          >
            {t.startFree}
          </button>
          <button
            onClick={() => onOpenModal('login')}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-white/10 backdrop-blur text-white border border-white/30 rounded-xl hover:bg-white/20 font-medium text-sm sm:text-base transition-all"
          >
            {t.signIn}
          </button>
        </div>
      </div>
      
      <div className="hidden sm:block absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}
