'use client';

import Image from 'next/image';

interface HeroTranslations {
  heroTitle1: string;
  heroTitle2: string;
  heroBrand: string;
  heroSubtitle: string;
  heroPerfectFor: string;
  heroAudiences: string[];
  heroDashboardLive: string;
  startFree: string;
}

interface HeroProps {
  t: HeroTranslations;
  isScrolled: boolean;
  onOpenModal: (mode: 'login' | 'register') => void;
}

function CheckCircle({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

export function Hero({ t, isScrolled: _isScrolled, onOpenModal }: HeroProps) {
  return (
    <section className="relative min-h-[100dvh] flex flex-col justify-center pt-28 pb-16 sm:pt-36 sm:pb-24 px-4 sm:px-6 overflow-hidden bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-emerald-500 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500 rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left: Copy */}
          <div>
            <h1 className="text-[2.14rem] sm:text-[2.85rem] lg:text-[3.56rem] font-bold tracking-tight leading-[1.1] mb-4 text-white">
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                {t.heroTitle1}
              </span>
              <br />
              {t.heroTitle2}{' '}
              <span className="relative inline-block">
                <span className="text-white">{t.heroBrand}</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                  <path d="M2 8c30-6 60-6 98-2s70 4 98-2" stroke="url(#hero-underline-grad)" strokeWidth="3" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="hero-underline-grad" x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#34d399" />
                      <stop offset="1" stopColor="#22d3ee" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>
            <p className="text-gray-400 text-base sm:text-lg max-w-lg mb-8 leading-relaxed">
              {t.heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <button
                onClick={() => onOpenModal('register')}
                className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium rounded-lg hover:from-emerald-400 hover:to-cyan-400 transition-all text-sm sm:text-base text-center shadow-lg shadow-emerald-500/25"
              >
                {t.startFree}
              </button>
            </div>
            {/* "Perfect for:" section */}
            <div>
              <p className="text-sm font-medium text-gray-400 mb-3">{t.heroPerfectFor}</p>
              <ul className="space-y-2.5">
                {t.heroAudiences.map((a, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-gray-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: Dashboard screenshot with floating elements */}
          <div className="relative mt-8 lg:mt-0">
            {/* Gradient glow behind image */}
            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-cyan-500/15 to-emerald-500/20 rounded-2xl blur-2xl opacity-60" />
            {/* Main dashboard image */}
            <div className="relative rounded-xl overflow-hidden border border-gray-800 shadow-2xl shadow-emerald-900/20">
              <Image
                src="/demo.png"
                alt="AKADEMO Dashboard"
                width={800}
                height={500}
                className="w-full h-auto"
                unoptimized
                priority
              />
              {/* "Live" badge */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-full">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-gray-300">{t.heroDashboardLive}</span>
              </div>
            </div>

            {/* Floating metric cards â€” 4 corners */}
            <style jsx>{`
              @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-8px); }
              }
            `}</style>

            {/* Top-left: 0% Cuentas compartidas */}
            <div className="absolute -top-4 -left-4 sm:-top-6 sm:-left-6 px-4 py-3 bg-gray-800 border border-gray-700/50 rounded-xl shadow-xl backdrop-blur-sm" style={{ animation: 'float 3s ease-in-out infinite' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <div>
                  <div className="text-lg font-bold text-white">0%</div>
                  <div className="text-xs text-gray-400 leading-tight">Cuentas compartidas</div>
                </div>
              </div>
            </div>

            {/* Top-right: 100% Control */}
            <div className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 px-4 py-3 bg-gray-800 border border-gray-700/50 rounded-xl shadow-xl backdrop-blur-sm" style={{ animation: 'float 3s ease-in-out infinite 0.75s' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-lg bg-emerald-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <div>
                  <div className="text-lg font-bold text-white">100%</div>
                  <div className="text-xs text-gray-400 leading-tight">Control total</div>
                </div>
              </div>
            </div>

            {/* Bottom-left: 24/7 Monitoreo AI */}
            <div className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 px-4 py-3 bg-gray-800 border border-gray-700/50 rounded-xl shadow-xl backdrop-blur-sm" style={{ animation: 'float 3s ease-in-out infinite 1.5s' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-lg bg-cyan-500 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-lg font-bold text-white">24/7</div>
                  <div className="text-xs text-gray-400 leading-tight">Monitoreo AI</div>
                </div>
              </div>
            </div>

            {/* Bottom-right: 25+ Funcionalidades */}
            <div className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 px-4 py-3 bg-gray-800 border border-gray-700/50 rounded-xl shadow-xl backdrop-blur-sm" style={{ animation: 'float 3s ease-in-out infinite 2.25s' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-lg bg-emerald-400 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                </div>
                <div>
                  <div className="text-lg font-bold text-white">25+</div>
                  <div className="text-xs text-gray-400 leading-tight">Funcionalidades</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

