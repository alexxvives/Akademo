'use client';

import { useState } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import AuthModal from '@/components/AuthModal';

type Lang = 'es' | 'en';

const translations = {
  es: {
    nav: { login: 'Iniciar Sesión', getStarted: 'Comenzar' },
    footer: {
      footerTagline: 'La plataforma de gestión académica diseñada para academias que se toman en serio su negocio.',
      footerRights: '© 2025 AKADEMO. Todos los derechos reservados.',
    },
    hero: {
      badge: 'Precios claros. Sin sorpresas.',
      title: 'Elige el plan adecuado para tu academia',
      subtitle: 'Empieza con todo lo que necesitas para proteger tu contenido, gestionar tus estudiantes y escalar.',
    },
    plans: [
      {
        key: 'pro',
        name: 'Pro',
        price: '€499',
        period: '/mes',
        desc: 'Para academias que quieren proteger su contenido, gestionar estudiantes y escalar sin límites.',
        cta: 'Comenzar',
        ctaLink: '/',
        highlight: true,
        badge: 'Más popular',
        features: [
          'Clases y estudiantes ilimitados',
          'Streaming seguro con BunnyCDN',
          'Clases en directo con Zoom',
          'Dashboard completo y analíticas',
          'Gestión de pagos con Stripe',
          'Firma y distribución de documentos',
          'Detección de suplantación de identidad',
          'Soporte prioritario',
          'Actualizaciones incluidas',
        ],
      },
      {
        key: 'enterprise',
        name: 'Enterprise',
        price: null as string | null,
        period: null as string | null,
        desc: 'Para grupos educativos y redes de academias con necesidades específicas y volumen elevado.',
        cta: 'Contactar con ventas',
        ctaLink: 'mailto:hola@akademo.es',
        highlight: false,
        badge: null as string | null,
        features: [
          'Todo lo incluido en Pro',
          'Múltiples academias unificadas',
          'SSO / integración LDAP',
          'Marca blanca personalizada',
          'SLA con tiempo de respuesta garantizado',
          'Gestor de cuenta dedicado',
          'Incorporación y formación personalizada',
          'Precio adaptado al volumen',
        ],
      },
    ],
    comparison: {
      title: 'Comparativa de planes',
      headers: ['Funcionalidad', 'Pro', 'Enterprise'],
      rows: [
        ['Clases ilimitadas', true, true],
        ['Estudiantes ilimitados', true, true],
        ['Streaming BunnyCDN', true, true],
        ['Clases en directo (Zoom)', true, true],
        ['Gestión de pagos (Stripe)', true, true],
        ['Firma de documentos', true, true],
        ['Detección de suplantación', true, true],
        ['Analíticas y reportes', true, true],
        ['Múltiples academias', false, true],
        ['SSO / integración LDAP', false, true],
        ['Marca blanca', false, true],
        ['Gestor de cuenta dedicado', false, true],
        ['SLA garantizado', false, true],
      ] as [string, boolean, boolean][],
    },
    faq: {
      title: 'Preguntas frecuentes',
      items: [
        {
          q: '¿Hay períodos de prueba?',
          a: 'Sí. Ofrecemos una demo personalizada y un período de prueba para que puedas comprobar que AKADEMO encaja antes de comprometerte.',
        },
        {
          q: '¿Qué pasa si supero el número de estudiantes?',
          a: 'No hay límite de estudiantes. El plan Pro incluye estudiantes y clases ilimitados sin costes adicionales por volumen.',
        },
        {
          q: '¿Puedo cambiar de plan más adelante?',
          a: 'Por supuesto. Puedes migrar a Enterprise en cualquier momento contactando con nuestro equipo de ventas.',
        },
        {
          q: '¿Qué incluye el soporte?',
          a: 'El plan Pro incluye soporte prioritario por email y chat. Enterprise incluye un gestor de cuenta dedicado con SLA garantizado.',
        },
        {
          q: '¿El precio incluye el IVA?',
          a: 'Los precios mostrados no incluyen IVA. El IVA aplicable se calculará en función de tu país de facturación.',
        },
      ],
    },
    trust: {
      title: '¿Por qué academias eligen AKADEMO?',
      items: [
        { title: 'Contenido protegido', desc: 'Tu material nunca se puede descargar ni compartir. BunnyCDN garantiza que solo tus alumnos vean tus clases.' },
        { title: 'Control total', desc: 'Gestiona pagos, asistencia, progreso y documentos desde un único dashboard centralizado.' },
        { title: 'Anti-fraude integrado', desc: 'Detección automática de suplantación de identidad para que cada alumno sea quien dice ser.' },
      ],
    },
  },
  en: {
    nav: { login: 'Log In', getStarted: 'Get started' },
    footer: {
      footerTagline: 'The academic management platform designed for academies that take their business seriously.',
      footerRights: '© 2025 AKADEMO. All rights reserved.',
    },
    hero: {
      badge: 'Clear pricing. No surprises.',
      title: 'Choose the right plan for your academy',
      subtitle: 'Start with everything you need to protect your content, manage your students, and scale.',
    },
    plans: [
      {
        key: 'pro',
        name: 'Pro',
        price: '€499',
        period: '/mo',
        desc: 'For academies that want to protect their content, manage students and scale without limits.',
        cta: 'Get started',
        ctaLink: '/',
        highlight: true,
        badge: 'Most popular',
        features: [
          'Unlimited classes and students',
          'Secure streaming with BunnyCDN',
          'Live classes with Zoom',
          'Full dashboard and analytics',
          'Payment management with Stripe',
          'Document signing and distribution',
          'Identity impersonation detection',
          'Priority support',
          'Updates included',
        ],
      },
      {
        key: 'enterprise',
        name: 'Enterprise',
        price: null as string | null,
        period: null as string | null,
        desc: 'For education groups and academy networks with specific needs and high volume.',
        cta: 'Contact sales',
        ctaLink: 'mailto:hola@akademo.es',
        highlight: false,
        badge: null as string | null,
        features: [
          'Everything in Pro',
          'Multiple unified academies',
          'SSO / LDAP integration',
          'Custom white label',
          'SLA with guaranteed response time',
          'Dedicated account manager',
          'Personalized onboarding and training',
          'Volume-adapted pricing',
        ],
      },
    ],
    comparison: {
      title: 'Plan comparison',
      headers: ['Feature', 'Pro', 'Enterprise'],
      rows: [
        ['Unlimited classes', true, true],
        ['Unlimited students', true, true],
        ['BunnyCDN streaming', true, true],
        ['Live classes (Zoom)', true, true],
        ['Payment management (Stripe)', true, true],
        ['Document signing', true, true],
        ['Impersonation detection', true, true],
        ['Analytics and reports', true, true],
        ['Multiple academies', false, true],
        ['SSO / LDAP integration', false, true],
        ['White label', false, true],
        ['Dedicated account manager', false, true],
        ['Guaranteed SLA', false, true],
      ] as [string, boolean, boolean][],
    },
    faq: {
      title: 'Frequently asked questions',
      items: [
        { q: 'Is there a free trial?', a: 'Yes. We offer a personalized demo and trial period so you can confirm AKADEMO fits your academy before committing.' },
        { q: 'What happens if I exceed the student limit?', a: 'There is no student limit. The Pro plan includes unlimited students and classes with no extra volume costs.' },
        { q: 'Can I switch plans later?', a: 'Absolutely. You can migrate to Enterprise at any time by contacting our sales team.' },
        { q: 'What does support include?', a: 'Pro includes priority email and chat support. Enterprise includes a dedicated account manager with a guaranteed SLA.' },
        { q: 'Are prices VAT inclusive?', a: 'Displayed prices exclude VAT. Applicable VAT is calculated based on your billing country.' },
      ],
    },
    trust: {
      title: 'Why academies choose AKADEMO?',
      items: [
        { title: 'Protected content', desc: 'Your material can never be downloaded or shared. BunnyCDN ensures only your students watch your classes.' },
        { title: 'Full control', desc: 'Manage payments, attendance, progress and documents from a single centralized dashboard.' },
        { title: 'Built-in anti-fraud', desc: 'Automatic identity impersonation detection so every student is who they say they are.' },
      ],
    },
  },
};

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function PricingPage() {
  const [lang, setLang] = useState<Lang>('es');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'login' | 'register'>('register');
  const [isScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const t = translations[lang];

  const openModal = (mode: 'login' | 'register') => {
    setModalMode(mode);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar t={t.nav} isScrolled={isScrolled} lang={lang} onLangChange={setLang} onOpenModal={openModal} />

      {/* HERO */}
      <section className="relative pt-40 pb-24 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 via-gray-950 to-gray-950 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-6">
            {t.hero.badge}
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">{t.hero.title}</h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">{t.hero.subtitle}</p>
        </div>
      </section>

      {/* PLANS */}
      <section className="px-4 sm:px-6 pb-24">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6 lg:gap-8">
          {t.plans.map((plan) => (
            <div
              key={plan.key}
              className={`relative rounded-2xl border p-8 flex flex-col ${
                plan.highlight ? 'bg-indigo-600 border-indigo-500 shadow-2xl shadow-indigo-900/40' : 'bg-gray-900 border-gray-800'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white text-indigo-700 shadow">
                  {plan.badge}
                </span>
              )}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">{plan.name}</h2>
                <p className={`text-sm leading-relaxed ${plan.highlight ? 'text-indigo-100' : 'text-gray-400'}`}>{plan.desc}</p>
              </div>
              <div className="mb-8">
                {plan.price ? (
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-extrabold text-white">{plan.price}</span>
                    <span className={`text-base pb-1 ${plan.highlight ? 'text-indigo-200' : 'text-gray-500'}`}>{plan.period}</span>
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-white">{lang === 'es' ? 'A medida' : 'Custom'}</div>
                )}
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckIcon />
                    <span className={`text-sm ${plan.highlight ? 'text-indigo-100' : 'text-gray-300'}`}>{feature}</span>
                  </li>
                ))}
              </ul>
              {plan.key === 'pro' ? (
                <button onClick={() => openModal('register')} className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all bg-white text-indigo-700 hover:bg-gray-100 shadow-lg">
                  {plan.cta}
                </button>
              ) : (
                <a href={plan.ctaLink} className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all bg-gray-800 text-white hover:bg-gray-700 border border-gray-700 text-center block">
                  {plan.cta}
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* TRUST */}
      <section className="px-4 sm:px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-12">{t.trust.title}</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {t.trust.items.map((item) => (
              <div key={item.title} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
                <h3 className="text-base font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="px-4 sm:px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-12">{t.comparison.title}</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    {t.comparison.headers.map((header, i) => (
                      <th key={i} className={`py-4 px-6 text-left text-sm font-semibold ${i === 0 ? 'text-gray-400 w-1/2' : i === 1 ? 'text-indigo-400' : 'text-gray-300'}`}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {t.comparison.rows.map((row, ri) => (
                    <tr key={ri} className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors">
                      <td className="py-4 px-6 text-sm text-gray-300">{row[0]}</td>
                      <td className="py-4 px-6">{row[1] ? <CheckIcon /> : <XIcon />}</td>
                      <td className="py-4 px-6">{row[2] ? <CheckIcon /> : <XIcon />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 sm:px-6 pb-32">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-12">{t.faq.title}</h2>
          <div className="space-y-3">
            {t.faq.items.map((item, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-gray-800/50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-sm font-medium text-white">{item.q}</span>
                  <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-sm text-gray-400 leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="px-4 sm:px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl p-12 text-center shadow-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              {lang === 'es' ? '¿Listo para empezar?' : 'Ready to get started?'}
            </h2>
            <p className="text-indigo-100 mb-8 max-w-xl mx-auto">
              {lang === 'es'
                ? 'Únete a las academias que ya confían en AKADEMO para gestionar su negocio educativo.'
                : 'Join the academies that already trust AKADEMO to manage their educational business.'}
            </p>
            <div className="flex justify-center">
              <button onClick={() => openModal('register')} className="px-8 py-3.5 bg-white text-indigo-700 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow">
                {lang === 'es' ? 'Comenzar' : 'Get started'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer t={t.footer} lang={lang} />

      {modalOpen && (
        <AuthModal mode={modalMode} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}
