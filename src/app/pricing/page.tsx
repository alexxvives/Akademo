'use client';

import { useState } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import AuthModal from '@/components/AuthModal';
import { translations, API_BASE_URL } from './pricing-translations';
import type { Lang } from './pricing-translations';
import { PricingSuccessContent } from './PricingSuccessContent';
import { PricingHeroForm } from './PricingHeroForm';
import { PricingFeatures } from './PricingFeatures';

export default function PricingPage() {
  const [lang, setLang] = useState<Lang>('es');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'login' | 'register'>('register');
  const [isScrolled] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    academyName: '',
    monthlyEnrollments: '',
    teacherCount: '',
    subjectCount: '',
    message: '',
  });

  const t = translations[lang];

  const openModal = (mode: 'login' | 'register') => {
    setModalMode(mode);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error || 'Error al enviar. Inténtalo de nuevo.');
      }
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar t={t.nav} isScrolled={isScrolled} lang={lang} onLangChange={setLang} onOpenModal={openModal} />

      {submitted ? (
        <PricingSuccessContent success={t.success} />
      ) : (
        <>
          <PricingHeroForm
            t={t}
            lang={lang}
            form={form}
            updateField={updateField}
            handleSubmit={handleSubmit}
            submitting={submitting}
            error={error}
          />
          <PricingFeatures features={t.features} />
        </>
      )}

      <Footer t={t.footer} lang={lang} />
      {modalOpen && <AuthModal mode={modalMode} onClose={() => setModalOpen(false)} />}
    </div>
  );
}
