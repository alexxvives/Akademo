'use client';

import Image from 'next/image';
import Link from 'next/link';

interface NavbarTranslations {
  login: string;
  getStarted: string;
}

interface NavbarProps {
  t: NavbarTranslations;
  isScrolled: boolean;
  lang: 'es' | 'en';
  onLangChange: (lang: 'es' | 'en') => void;
  onOpenModal: (mode: 'login' | 'register') => void;
}

export function Navbar({ t, isScrolled, lang, onLangChange, onOpenModal }: NavbarProps) {
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 transition-all">
        <div className="mx-3 sm:mx-6 mt-3 sm:mt-4">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg bg-white/10 border border-white/20">
            <div className="flex justify-between items-center relative">
              <Link href="/" className="flex items-center gap-2">
                <Image 
                  src="/logo/AKADEMO_logo_OTHER2.svg"
                  alt="AKADEMO" 
                  width={140}
                  height={36}
                  className="h-7 sm:h-9 w-auto transition-all"
                />
                <span className={`text-lg sm:text-xl font-bold transition-colors font-[family-name:var(--font-montserrat)] ${
                  isScrolled ? 'text-gray-900' : 'text-white'
                }`}>AKADEMO</span>
              </Link>

              {/* Center nav */}

              
              <div className="flex items-center gap-1 sm:gap-3 justify-end">
                {/* Language flags — inline on mobile, hidden on desktop (desktop uses fixed floating) */}
                <div className="flex sm:hidden items-center gap-1 mr-0.5">
                  <button
                    onClick={() => onLangChange('es')}
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-all overflow-hidden shadow-sm ${lang === 'es' ? 'bg-white/90 ring-1 ring-white/50 scale-105' : 'bg-white/25 hover:bg-white/50'}`}
                    title="Español"
                  >
                    <Image src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 600'%3E%3Cpath fill='%23c60b1e' d='M0 0h900v600H0z'/%3E%3Cpath fill='%23ffc400' d='M0 150h900v300H0z'/%3E%3C/svg%3E" alt="ES" width={18} height={12} unoptimized className="w-4 h-auto" />
                  </button>
                  <button
                    onClick={() => onLangChange('en')}
                    className={`w-7 h-7 rounded-md flex items-center justify-center transition-all overflow-hidden shadow-sm ${lang === 'en' ? 'bg-white/90 ring-1 ring-white/50 scale-105' : 'bg-white/25 hover:bg-white/50'}`}
                    title="English"
                  >
                    <Image src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 30'%3E%3Cpath fill='%23012169' d='M0 0h60v30H0z'/%3E%3Cpath stroke='%23fff' stroke-width='6' d='M0 0l60 30m0-30L0 30'/%3E%3Cpath stroke='%23C8102E' stroke-width='4' d='M0 0l60 30m0-30L0 30'/%3E%3Cpath stroke='%23fff' stroke-width='10' d='M30 0v30M0 15h60'/%3E%3Cpath stroke='%23C8102E' stroke-width='6' d='M30 0v30M0 15h60'/%3E%3C/svg%3E" alt="EN" width={18} height={12} unoptimized className="w-4 h-auto" />
                  </button>
                </div>
                {/* Login: user icon on mobile, text on desktop */}
                <button
                  onClick={() => onOpenModal('login')}
                  className={`flex items-center justify-center px-1.5 sm:px-4 py-1.5 sm:py-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    isScrolled ? 'text-gray-600 hover:text-gray-900' : 'text-white/90 hover:text-white'
                  }`}
                >
                  <span className="hidden sm:inline">{t.login}</span>
                  <svg className="sm:hidden w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </button>
                <button
                  onClick={() => onOpenModal('register')}
                  className={`hidden sm:block px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-all shadow-sm whitespace-nowrap ${
                    isScrolled 
                      ? 'bg-gray-900 text-white hover:bg-gray-800' 
                      : 'bg-white text-gray-900 hover:bg-white/90'
                  }`}
                >
                  {t.getStarted}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex fixed top-6 right-6 z-50 gap-1.5">
          <button
            onClick={() => onLangChange('es')}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all overflow-hidden shadow-lg ${
              lang === 'es' 
                ? 'bg-white scale-110' 
                : 'bg-white/70 hover:bg-white/90 backdrop-blur'
            }`}
            title="Español"
          >
            <Image 
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 600'%3E%3Cpath fill='%23c60b1e' d='M0 0h900v600H0z'/%3E%3Cpath fill='%23ffc400' d='M0 150h900v300H0z'/%3E%3C/svg%3E" 
              alt="ES" 
              width={24}
              height={24}
              unoptimized
              className="w-5 h-5 sm:w-6 sm:h-6"
            />
          </button>
          <button
            onClick={() => onLangChange('en')}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all overflow-hidden shadow-lg ${
              lang === 'en' 
                ? 'bg-white scale-110' 
                : 'bg-white/70 hover:bg-white/90 backdrop-blur'
            }`}
            title="English"
          >
            <Image 
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 30'%3E%3Cpath fill='%23012169' d='M0 0h60v30H0z'/%3E%3Cpath stroke='%23fff' stroke-width='6' d='M0 0l60 30m0-30L0 30'/%3E%3Cpath stroke='%23C8102E' stroke-width='4' d='M0 0l60 30m0-30L0 30'/%3E%3Cpath stroke='%23fff' stroke-width='10' d='M30 0v30M0 15h60'/%3E%3Cpath stroke='%23C8102E' stroke-width='6' d='M30 0v30M0 15h60'/%3E%3C/svg%3E" 
              alt="EN" 
              width={24}
              height={24}
              unoptimized
              className="w-5 h-5 sm:w-6 sm:h-6"
            />
          </button>
        </div>
      </header>

    </>
  );
}
