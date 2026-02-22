'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import AuthModal from '@/components/AuthModal';
import { SkeletonForm } from '@/components/ui/SkeletonLoader';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { WhySection } from '@/components/landing/WhySection';
import { AccountSharingSection } from '@/components/landing/AccountSharingSection';
import { ContentProtectionSection } from '@/components/landing/ContentProtectionSection';
import { WatermarkSection } from '@/components/landing/WatermarkSection';
import { ManagementSection } from '@/components/landing/ManagementSection';
import { CalculatorSection } from '@/components/landing/CalculatorSection';
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
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsScrolled(entry.target.getAttribute('data-section-dark') !== 'true');
          }
        });
      },
      { rootMargin: '-60px 0px -80% 0px', threshold: 0 }
    );
    document.querySelectorAll('[data-section-dark]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
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

  const [modalDefaultRole, setModalDefaultRole] = useState<string | undefined>();

  const openModal = (mode: 'login' | 'register', defaultRole?: string) => {
    setModalMode(mode);
    setModalDefaultRole(defaultRole);
    window.history.pushState({}, '', `/?modal=${mode}`);
    setShowModal(true);
  };

  const closeModal = () => {
    window.history.pushState({}, '', '/');
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {showModal && <AuthModal mode={modalMode} defaultRole={modalDefaultRole} onClose={closeModal} />}

      <Navbar 
        t={t}
        isScrolled={isScrolled}
        lang={lang}
        onLangChange={setLang}
        onOpenModal={openModal}
      />

      <div data-section-dark="true">
        <Hero t={t} isScrolled={isScrolled} onOpenModal={openModal} />
      </div>
      <div data-section-dark="false">
        <WhySection t={t} />
      </div>
      <div data-section-dark="true">
        <AccountSharingSection t={t} />
      </div>
      <div data-section-dark="false">
        <ContentProtectionSection t={t} />
      </div>
      <div data-section-dark="true">
        <WatermarkSection t={t} />
      </div>
      <div data-section-dark="false">
        <ManagementSection t={t} />
      </div>
      <div data-section-dark="true">
        <CalculatorSection lang={lang} />
      </div>
      <div data-section-dark="false">
        <ContactSection lang={lang} />
      </div>
      <div data-section-dark="false">
        <CTASection t={t} onOpenModal={openModal} />
      </div>

      <Footer t={t} lang={lang} />
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <SkeletonForm />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <HomePageContent />
    </Suspense>
  );
}
