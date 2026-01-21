'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import AuthModal from '@/components/AuthModal';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { WhySection } from '@/components/landing/WhySection';
import { AccountSharingSection } from '@/components/landing/AccountSharingSection';
import { ContentProtectionSection } from '@/components/landing/ContentProtectionSection';
import { WatermarkSection } from '@/components/landing/WatermarkSection';
import { ManagementSection } from '@/components/landing/ManagementSection';
import { CTASection } from '@/components/landing/CTASection';
import { ContactSection } from '@/components/landing/ContactSection';
import { Footer } from '@/components/landing/Footer';
import { translations, Language } from '@/lib/translations';

function HomePageContent() {
  const searchParams = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'login' | 'register'>('login');
  const [lang, setLang] = useState<Language>('es');
  const [isScrolled, setIsScrolled] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = window.innerHeight;
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > heroHeight - 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const modal = searchParams.get('modal');
    if (modal === 'login' || modal === 'register') {
      setModalMode(modal);
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [searchParams]);

  const openModal = (mode: 'login' | 'register') => {
    setModalMode(mode);
    window.history.pushState({}, '', `/?modal=${mode}`);
    setShowModal(true);
  };

  const closeModal = () => {
    window.history.pushState({}, '', '/');
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {showModal && <AuthModal mode={modalMode} onClose={closeModal} />}

      <Navbar 
        t={t}
        isScrolled={isScrolled}
        lang={lang}
        onLangChange={setLang}
        onOpenModal={openModal}
      />

      <Hero 
        t={t}
        isScrolled={isScrolled}
        onOpenModal={openModal}
      />

      <WhySection t={t} />
      <AccountSharingSection t={t} />
      <ContentProtectionSection t={t} />
      <WatermarkSection t={t} />
      <ManagementSection t={t} />
      <CTASection t={t} onOpenModal={openModal} />
      <ContactSection lang={lang} />

      <Footer t={t} lang={lang} />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
