'use client';

import { useState } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import AuthModal from '@/components/AuthModal';

type Lang = 'es' | 'en';

const navTranslations = {
  es: { login: 'Iniciar Sesión', getStarted: 'Comenzar' },
  en: { login: 'Log In', getStarted: 'Get started' },
};

const footerTranslations = {
  es: { footerTagline: 'La plataforma de gestión académica diseñada para academias que se toman en serio su negocio.' },
  en: { footerTagline: 'The academic management platform designed for academies that take their business seriously.' },
};

export function BlogPageWrapper({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('es');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'login' | 'register'>('register');

  const openModal = (mode: 'login' | 'register') => {
    setModalMode(mode);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {modalOpen && <AuthModal mode={modalMode} onClose={() => setModalOpen(false)} />}
      <Navbar
        t={navTranslations[lang]}
        isScrolled={false}
        lang={lang}
        onLangChange={setLang}
        onOpenModal={openModal}
      />
      {children}
      <Footer t={footerTranslations[lang]} lang={lang} />
    </div>
  );
}
