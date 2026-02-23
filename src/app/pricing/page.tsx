'use client';

import { useState } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import AuthModal from '@/components/AuthModal';

type Lang = 'es' | 'en';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://akademo-api.alexxvives.workers.dev';

function FeatureIcon({ type }: { type: string }) {
  switch (type) {
    case 'shield':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case 'users':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    case 'zap':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'lock':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      );
    default:
      return null;
  }
}

function RangeSelector({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            value === opt
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

const translations = {
  es: {
    nav: { login: 'Iniciar Sesión', getStarted: 'Comenzar' },
    footer: {
      footerTagline: 'La plataforma de gestión académica diseñada para academias que se toman en serio su negocio.',
      footerRights: '© 2025 AKADEMO. Todos los derechos reservados.',
    },
    hero: {
      badge: 'Planes a medida',
      title: 'Nos adaptamos a ti',
      subtitle: 'Cada academia es única. Cuéntanos sobre la tuya y te propondremos el plan que mejor encaja con tu tamaño y necesidades.',
    },
    form: {
      title: 'Solicita tu propuesta personalizada',
      name: 'Nombre completo',
      namePlaceholder: 'Tu nombre',
      email: 'Email',
      emailPlaceholder: 'tu@academia.com',
      phone: 'Teléfono (opcional)',
      phonePlaceholder: '+34 600 000 000',
      academyName: 'Nombre de tu academia',
      academyNamePlaceholder: 'Mi Academia',
      monthlyEnrollments: '¿Cuántas matrículas al mes?',
      teacherCount: '¿Cuántos profesores?',
      subjectCount: '¿Cuántas asignaturas?',
      message: 'Cuéntanos más (opcional)',
      messagePlaceholder: '¿Tienes alguna necesidad especial o pregunta?',
      submit: 'Solicitar propuesta',
      submitting: 'Enviando...',
      ranges: {
        enrollments: ['1-20', '21-50', '51-100', '101-300', '300+'],
        teachers: ['1', '2-5', '6-10', '11-20', '20+'],
        subjects: ['1-3', '4-10', '11-20', '20+'],
      },
    },
    success: {
      title: '¡Propuesta solicitada!',
      subtitle: 'Hemos recibido tu información. Nuestro equipo se pondrá en contacto contigo en menos de 24h con una propuesta personalizada.',
      cta: 'Volver al inicio',
    },
    side: {
      badge: 'Solicitar precios',
      title: 'Nos adaptamos a tus necesidades',
      subtitle: 'Cuéntanos sobre tu academia y te preparamos un plan a medida.',
      bullets: [
        { title: 'Protección total del contenido', desc: 'Streaming seguro con BunnyCDN. Tu material nunca se puede descargar ni compartir.' },
        { title: 'Cero cuentas compartidas', desc: 'Detectamos y bloqueamos el acceso de estudiantes fantasma en tiempo real.' },
        { title: 'Gestión completa en un lugar', desc: 'Pagos, asistencia, ejercicios y documentos desde un único dashboard.' },
        { title: 'Soporte prioritario', desc: 'Acompañamiento desde el onboarding hasta que tu academia esté en marcha.' },
      ],
      testimonial: '«Nos ahorra horas cada semana. Antes gestéionabamos todo en Excel; ahora todo está centralizado y los estudiantes no pueden compartir acceso.»',
      testimonialAuthor: 'Director de academia',
    },
    features: [
      { icon: 'shield', title: 'Contenido protegido', desc: 'Streaming seguro con BunnyCDN. Tu material nunca se podrá descargar ni compartir.' },
      { icon: 'users', title: 'Sin límite de estudiantes', desc: 'Todos los planes incluyen estudiantes y clases ilimitadas.' },
      { icon: 'zap', title: 'Clases en directo', desc: 'Integración con Zoom para clases en vivo sin salir de la plataforma.' },
      { icon: 'lock', title: 'Anti-fraude integrado', desc: 'Detección automática de suplantación de identidad y cuentas compartidas.' },
    ],
  },
  en: {
    nav: { login: 'Log In', getStarted: 'Get started' },
    footer: {
      footerTagline: 'The academic management platform designed for academies that take their business seriously.',
      footerRights: '© 2025 AKADEMO. All rights reserved.',
    },
    hero: {
      badge: 'Custom plans',
      title: 'We adapt to you',
      subtitle: 'Every academy is unique. Tell us about yours and we\'ll propose the plan that best fits your size and needs.',
    },
    form: {
      title: 'Request your personalized proposal',
      name: 'Full name',
      namePlaceholder: 'Your name',
      email: 'Email',
      emailPlaceholder: 'you@academy.com',
      phone: 'Phone (optional)',
      phonePlaceholder: '+1 555 000 000',
      academyName: 'Academy name',
      academyNamePlaceholder: 'My Academy',
      monthlyEnrollments: 'Monthly enrollments?',
      teacherCount: 'How many teachers?',
      subjectCount: 'How many subjects?',
      message: 'Tell us more (optional)',
      messagePlaceholder: 'Any special needs or questions?',
      submit: 'Request proposal',
      submitting: 'Sending...',
      ranges: {
        enrollments: ['1-20', '21-50', '51-100', '101-300', '300+'],
        teachers: ['1', '2-5', '6-10', '11-20', '20+'],
        subjects: ['1-3', '4-10', '11-20', '20+'],
      },
    },
    success: {
      title: 'Proposal requested!',
      subtitle: 'We\'ve received your information. Our team will contact you within 24h with a personalized proposal.',
      cta: 'Back to home',
    },
    side: {
      badge: 'Request pricing',
      title: 'We adapt to your needs',
      subtitle: 'Tell us about your academy and we\'ll prepare a tailored plan.',
      bullets: [
        { title: 'Total content protection', desc: 'Secure streaming with BunnyCDN. Your material can never be downloaded or shared.' },
        { title: 'Zero account sharing', desc: 'We detect and block ghost student access in real time.' },
        { title: 'Full management in one place', desc: 'Payments, attendance, assignments and documents from a single dashboard.' },
        { title: 'Priority support', desc: 'Guidance from onboarding until your academy is fully live.' },
      ],
      testimonial: '"It saves us hours every week. We used to manage everything in spreadsheets; now it\'s all centralized and students can\'t share access."',
      testimonialAuthor: 'Academy director',
    },
    features: [
      { icon: 'shield', title: 'Protected content', desc: 'Secure streaming with BunnyCDN. Your material can never be downloaded or shared.' },
      { icon: 'users', title: 'Unlimited students', desc: 'All plans include unlimited students and classes.' },
      { icon: 'zap', title: 'Live classes', desc: 'Zoom integration for live classes without leaving the platform.' },
      { icon: 'lock', title: 'Built-in anti-fraud', desc: 'Automatic identity impersonation and account sharing detection.' },
    ],
  },
};

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

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar t={t.nav} isScrolled={isScrolled} lang={lang} onLangChange={setLang} onOpenModal={openModal} />
        <section className="relative pt-40 pb-32 px-4 sm:px-6">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 via-gray-950 to-gray-950 pointer-events-none" />
          <div className="relative max-w-lg mx-auto text-center">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t.success.title}</h1>
            <p className="text-lg text-gray-400 mb-10">{t.success.subtitle}</p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/25"
            >
              {t.success.cta}
            </a>
          </div>
        </section>
        <Footer t={t.footer} lang={lang} />
        {modalOpen && <AuthModal mode={modalMode} onClose={() => setModalOpen(false)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar t={t.nav} isScrolled={isScrolled} lang={lang} onLangChange={setLang} onOpenModal={openModal} />

      {/* HERO + FORM SECTION - side by side */}
      <section className="relative pt-36 pb-24 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 via-gray-950 to-gray-950 pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-start">

            {/* LEFT: pitch content */}
            <div className="lg:pt-6 flex flex-col gap-6">
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-5">
                  {t.side.badge}
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">{t.side.title}</h1>
                <p className="text-gray-400 leading-relaxed">{t.side.subtitle}</p>
              </div>

              <ul className="space-y-4">
                {t.side.bullets.map((b) => (
                  <li key={b.title} className="flex items-start gap-3">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{b.title}</p>
                      <p className="text-sm text-gray-500 leading-relaxed">{b.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
                <p className="text-sm text-gray-300 italic leading-relaxed mb-3">{t.side.testimonial}</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">A</div>
                  <span className="text-xs text-gray-400">{t.side.testimonialAuthor}</span>
                </div>
              </div>
            </div>

            {/* RIGHT: Form */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 sm:p-10">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-8">{t.form.title}</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name + Email */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t.form.name} *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder={t.form.namePlaceholder}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t.form.email} *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder={t.form.emailPlaceholder}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Phone + Academy Name */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t.form.phone}</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder={t.form.phonePlaceholder}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t.form.academyName}</label>
                  <input
                    type="text"
                    value={form.academyName}
                    onChange={(e) => updateField('academyName', e.target.value)}
                    placeholder={t.form.academyNamePlaceholder}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Monthly Enrollments */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">{t.form.monthlyEnrollments}</label>
                <RangeSelector
                  options={t.form.ranges.enrollments}
                  value={form.monthlyEnrollments}
                  onChange={(v) => updateField('monthlyEnrollments', v)}
                />
              </div>

              {/* Teachers */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">{t.form.teacherCount}</label>
                <RangeSelector
                  options={t.form.ranges.teachers}
                  value={form.teacherCount}
                  onChange={(v) => updateField('teacherCount', v)}
                />
              </div>

              {/* Subjects */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">{t.form.subjectCount}</label>
                <RangeSelector
                  options={t.form.ranges.subjects}
                  value={form.subjectCount}
                  onChange={(v) => updateField('subjectCount', v)}
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t.form.message}</label>
                <textarea
                  value={form.message}
                  onChange={(e) => updateField('message', e.target.value)}
                  placeholder={t.form.messagePlaceholder}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              {error && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold text-base hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? t.form.submitting : t.form.submit}
              </button>
            </form>
          </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-4 sm:px-6 pb-32">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.features.map((feature) => (
              <div key={feature.title} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-indigo-400">
                  <FeatureIcon type={feature.icon} />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer t={t.footer} lang={lang} />

      {modalOpen && <AuthModal mode={modalMode} onClose={() => setModalOpen(false)} />}
    </div>
  );
}
