'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type Lang = 'es' | 'en';

const t = {
  es: {
    nav: { features: 'Características', pricing: 'Precios', login: 'Iniciar Sesión', cta: 'Empieza Gratis' },
    hero: {
      badge: 'Precios Transparentes',
      title1: 'Precios simples.',
      titleHighlight: 'Sin sorpresas.',
      subtitle: 'Elige el plan que mejor se adapte a tu academia. Escala cuando lo necesites.',
      monthly: 'Mensual',
      annually: 'Anual',
      annualSave: 'Ahorra 20%',
    },
    plans: [
      {
        name: 'Starter',
        desc: 'Para academias que empiezan y quieren proteger su contenido.',
        priceMonthly: 'Gratis',
        priceAnnual: 'Gratis',
        isFree: true,
        cta: 'Empezar Gratis',
        features: [
          'Hasta 3 clases',
          'Hasta 50 estudiantes',
          '5 GB de almacenamiento',
          'Protección anti-compartir',
          'Marca de agua básica',
          'Dashboard básico',
          'Soporte por email',
        ],
        highlight: false,
      },
      {
        name: 'Pro',
        desc: 'Para academias consolidadas que necesitan control total.',
        priceMonthly: '€49',
        priceAnnual: '€39',
        isFree: false,
        cta: 'Comenzar Prueba Gratis',
        popular: true,
        features: [
          'Clases ilimitadas',
          'Estudiantes ilimitados',
          '100 GB de almacenamiento',
          'Todo del plan Starter',
          'Clases en directo con Zoom',
          'Tareas y evaluaciones',
          'Gestión de pagos',
          'Marca de agua avanzada',
          'Informes descargables',
          'Soporte prioritario',
        ],
        highlight: true,
      },
      {
        name: 'Enterprise',
        desc: 'Para redes de academias con necesidades avanzadas.',
        priceMonthly: 'Custom',
        priceAnnual: 'Custom',
        isFree: false,
        cta: 'Contactar Ventas',
        features: [
          'Todo del plan Pro',
          'Almacenamiento ilimitado',
          'Multi-academia',
          'API personalizada',
          'SSO / SAML',
          'SLA garantizado',
          'Account Manager dedicado',
          'Onboarding personalizado',
          'Facturación personalizada',
        ],
        highlight: false,
      },
    ],
    perMonth: '/mes',
    compare: {
      title: 'Comparar Planes',
      subtitle: 'Mira exactamente qué incluye cada plan.',
      categories: [
        {
          name: 'Contenido',
          features: [
            { name: 'Clases', starter: 'Hasta 3', pro: 'Ilimitadas', enterprise: 'Ilimitadas' },
            { name: 'Estudiantes', starter: 'Hasta 50', pro: 'Ilimitados', enterprise: 'Ilimitados' },
            { name: 'Almacenamiento', starter: '5 GB', pro: '100 GB', enterprise: 'Ilimitado' },
            { name: 'Streaming seguro', starter: true, pro: true, enterprise: true },
          ],
        },
        {
          name: 'Protección',
          features: [
            { name: 'Anti-compartir', starter: true, pro: true, enterprise: true },
            { name: 'Marca de agua', starter: 'Básica', pro: 'Avanzada', enterprise: 'Avanzada' },
            { name: 'Detección de patrones', starter: false, pro: true, enterprise: true },
            { name: 'Alertas tiempo real', starter: false, pro: true, enterprise: true },
          ],
        },
        {
          name: 'Gestión',
          features: [
            { name: 'Dashboard', starter: 'Básico', pro: 'Completo', enterprise: 'Completo' },
            { name: 'Gestión de pagos', starter: false, pro: true, enterprise: true },
            { name: 'Tareas y evaluaciones', starter: false, pro: true, enterprise: true },
            { name: 'Informes descargables', starter: false, pro: true, enterprise: true },
          ],
        },
        {
          name: 'Directo',
          features: [
            { name: 'Clases en directo (Zoom)', starter: false, pro: true, enterprise: true },
            { name: 'Grabación automática', starter: false, pro: true, enterprise: true },
            { name: 'Multi-academia', starter: false, pro: false, enterprise: true },
          ],
        },
        {
          name: 'Soporte',
          features: [
            { name: 'Email', starter: true, pro: true, enterprise: true },
            { name: 'Prioritario', starter: false, pro: true, enterprise: true },
            { name: 'Account Manager', starter: false, pro: false, enterprise: true },
            { name: 'SLA garantizado', starter: false, pro: false, enterprise: true },
          ],
        },
      ],
    },
    faq: {
      title: 'Preguntas sobre Precios',
      items: [
        { q: '¿Puedo cambiar de plan en cualquier momento?', a: 'Sí. Puedes upgradar o downgrader tu plan en cualquier momento. Los cambios se aplican inmediatamente y se prorratea el cobro.' },
        { q: '¿Hay compromiso de permanencia?', a: 'No. Puedes cancelar en cualquier momento. En el plan anual, disfrutas del descuento durante todo el año y puedes cancelar la renovación.' },
        { q: '¿Qué métodos de pago aceptáis?', a: 'Aceptamos todas las tarjetas de crédito y débito principales a través de Stripe. También facturación bancaria para el plan Enterprise.' },
        { q: '¿Qué pasa si supero los límites del plan Starter?', a: 'Te avisamos cuando te acerques al límite. Puedes upgradar al plan Pro en un clic sin perder datos ni configuración.' },
        { q: '¿Ofrecéis descuento para educación?', a: 'Sí. Contacta con nuestro equipo para planes especiales para instituciones educativas sin ánimo de lucro.' },
      ],
    },
    cta: {
      title1: '¿Listo para proteger',
      titleHighlight: 'tu academia',
      title2: '?',
      subtitle: 'Empieza gratis hoy. Sin tarjeta de crédito.',
      button: 'Empieza Gratis',
    },
    footer: {
      tagline: 'Plataforma de protección y gestión para academias online que quieren proteger su contenido y crecer.',
      rights: '© 2025 AKADEMO. Todos los derechos reservados.',
      product: 'Producto', company: 'Compañía', legal: 'Legal',
      featuresLink: 'Características', pricingLink: 'Precios',
      contactLink: 'Contacto', privacyLink: 'Privacidad', termsLink: 'Términos',
    },
  },
  en: {
    nav: { features: 'Features', pricing: 'Pricing', login: 'Login', cta: 'Start Free' },
    hero: {
      badge: 'Transparent Pricing',
      title1: 'Simple pricing.',
      titleHighlight: 'No surprises.',
      subtitle: 'Choose the plan that fits your academy. Scale when you need it.',
      monthly: 'Monthly',
      annually: 'Annual',
      annualSave: 'Save 20%',
    },
    plans: [
      {
        name: 'Starter',
        desc: 'For academies starting out that want to protect their content.',
        priceMonthly: 'Free',
        priceAnnual: 'Free',
        isFree: true,
        cta: 'Start Free',
        features: [
          'Up to 3 classes',
          'Up to 50 students',
          '5 GB storage',
          'Anti-sharing protection',
          'Basic watermark',
          'Basic dashboard',
          'Email support',
        ],
        highlight: false,
      },
      {
        name: 'Pro',
        desc: 'For established academies that need full control.',
        priceMonthly: '€49',
        priceAnnual: '€39',
        isFree: false,
        cta: 'Start Free Trial',
        popular: true,
        features: [
          'Unlimited classes',
          'Unlimited students',
          '100 GB storage',
          'Everything in Starter',
          'Live classes with Zoom',
          'Assignments & grading',
          'Payment management',
          'Advanced watermark',
          'Downloadable reports',
          'Priority support',
        ],
        highlight: true,
      },
      {
        name: 'Enterprise',
        desc: 'For academy networks with advanced needs.',
        priceMonthly: 'Custom',
        priceAnnual: 'Custom',
        isFree: false,
        cta: 'Contact Sales',
        features: [
          'Everything in Pro',
          'Unlimited storage',
          'Multi-academy',
          'Custom API',
          'SSO / SAML',
          'Guaranteed SLA',
          'Dedicated Account Manager',
          'Personalized onboarding',
          'Custom billing',
        ],
        highlight: false,
      },
    ],
    perMonth: '/mo',
    compare: {
      title: 'Compare Plans',
      subtitle: 'See exactly what each plan includes.',
      categories: [
        {
          name: 'Content',
          features: [
            { name: 'Classes', starter: 'Up to 3', pro: 'Unlimited', enterprise: 'Unlimited' },
            { name: 'Students', starter: 'Up to 50', pro: 'Unlimited', enterprise: 'Unlimited' },
            { name: 'Storage', starter: '5 GB', pro: '100 GB', enterprise: 'Unlimited' },
            { name: 'Secure streaming', starter: true, pro: true, enterprise: true },
          ],
        },
        {
          name: 'Protection',
          features: [
            { name: 'Anti-sharing', starter: true, pro: true, enterprise: true },
            { name: 'Watermark', starter: 'Basic', pro: 'Advanced', enterprise: 'Advanced' },
            { name: 'Pattern detection', starter: false, pro: true, enterprise: true },
            { name: 'Real-time alerts', starter: false, pro: true, enterprise: true },
          ],
        },
        {
          name: 'Management',
          features: [
            { name: 'Dashboard', starter: 'Basic', pro: 'Complete', enterprise: 'Complete' },
            { name: 'Payment management', starter: false, pro: true, enterprise: true },
            { name: 'Assignments & grading', starter: false, pro: true, enterprise: true },
            { name: 'Downloadable reports', starter: false, pro: true, enterprise: true },
          ],
        },
        {
          name: 'Live',
          features: [
            { name: 'Live classes (Zoom)', starter: false, pro: true, enterprise: true },
            { name: 'Auto recording', starter: false, pro: true, enterprise: true },
            { name: 'Multi-academy', starter: false, pro: false, enterprise: true },
          ],
        },
        {
          name: 'Support',
          features: [
            { name: 'Email', starter: true, pro: true, enterprise: true },
            { name: 'Priority', starter: false, pro: true, enterprise: true },
            { name: 'Account Manager', starter: false, pro: false, enterprise: true },
            { name: 'Guaranteed SLA', starter: false, pro: false, enterprise: true },
          ],
        },
      ],
    },
    faq: {
      title: 'Pricing Questions',
      items: [
        { q: 'Can I switch plans at any time?', a: 'Yes. You can upgrade or downgrade your plan at any time. Changes apply immediately and billing is prorated.' },
        { q: 'Is there a commitment period?', a: 'No. You can cancel at any time. With the annual plan, you enjoy the discount for the full year and can cancel renewal.' },
        { q: 'What payment methods do you accept?', a: 'We accept all major credit and debit cards through Stripe. Bank invoicing is also available for Enterprise plans.' },
        { q: 'What happens if I exceed the Starter plan limits?', a: 'We\'ll notify you when you\'re close to the limit. You can upgrade to Pro in one click without losing data or configuration.' },
        { q: 'Do you offer education discounts?', a: 'Yes. Contact our team for special plans for non-profit educational institutions.' },
      ],
    },
    cta: {
      title1: 'Ready to protect',
      titleHighlight: 'your academy',
      title2: '?',
      subtitle: 'Start free today. No credit card required.',
      button: 'Start Free',
    },
    footer: {
      tagline: 'Protection and management platform for online academies that want to protect their content and grow.',
      rights: '© 2025 AKADEMO. All rights reserved.',
      product: 'Product', company: 'Company', legal: 'Legal',
      featuresLink: 'Features', pricingLink: 'Pricing',
      contactLink: 'Contact', privacyLink: 'Privacy', termsLink: 'Terms',
    },
  },
};

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 ${className}`} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

function XIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) return <CheckIcon className="text-emerald-400" />;
  if (value === false) return <XIcon className="text-gray-600" />;
  return <span className="text-gray-300 text-sm">{value}</span>;
}

export default function PricingPage() {
  const [lang, setLang] = useState<Lang>('es');
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const tr = t[lang];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* ─── NAVBAR ─── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo/AKADEMO_logo_OTHER2.svg" alt="AKADEMO" width={140} height={36} className="h-7 sm:h-8 w-auto brightness-0 invert" />
            <span className="text-lg font-bold tracking-tight font-[family-name:var(--font-montserrat)]">AKADEMO</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/features" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">{tr.nav.features}</Link>
            <Link href="/pricing" className="text-sm font-medium text-white">{tr.nav.pricing}</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/?modal=login" className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:inline">{tr.nav.login}</Link>
            <Link href="/?modal=register" className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-200 transition-all">
              {tr.nav.cta}
            </Link>
          </div>
        </div>
        {/* Lang switcher */}
        <div className="fixed top-3 right-28 sm:right-36 z-50 flex gap-1">
          <button onClick={() => setLang('es')} className={`w-7 h-7 rounded-md flex items-center justify-center text-xs transition-all ${lang === 'es' ? 'bg-white/20 ring-1 ring-white/30' : 'bg-white/5 hover:bg-white/10'}`}>
            <Image src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 600'%3E%3Cpath fill='%23c60b1e' d='M0 0h900v600H0z'/%3E%3Cpath fill='%23ffc400' d='M0 150h900v300H0z'/%3E%3C/svg%3E" alt="ES" width={16} height={16} unoptimized className="w-4 h-4" />
          </button>
          <button onClick={() => setLang('en')} className={`w-7 h-7 rounded-md flex items-center justify-center text-xs transition-all ${lang === 'en' ? 'bg-white/20 ring-1 ring-white/30' : 'bg-white/5 hover:bg-white/10'}`}>
            <Image src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 30'%3E%3Cpath fill='%23012169' d='M0 0h60v30H0z'/%3E%3Cpath stroke='%23fff' stroke-width='6' d='M0 0l60 30m0-30L0 30'/%3E%3Cpath stroke='%23C8102E' stroke-width='4' d='M0 0l60 30m0-30L0 30'/%3E%3Cpath stroke='%23fff' stroke-width='10' d='M30 0v30M0 15h60'/%3E%3Cpath stroke='%23C8102E' stroke-width='6' d='M30 0v30M0 15h60'/%3E%3C/svg%3E" alt="EN" width={16} height={16} unoptimized className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ─── HERO + PRICING CARDS ─── */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-medium mb-8">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              {tr.hero.badge}
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-4">
              {tr.hero.title1}
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{tr.hero.titleHighlight}</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-400 max-w-xl mx-auto mb-10">{tr.hero.subtitle}</p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-3 p-1 bg-white/[0.03] border border-white/[0.06] rounded-full">
              <button
                onClick={() => setAnnual(false)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${!annual ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
              >
                {tr.hero.monthly}
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all flex items-center gap-2 ${annual ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
              >
                {tr.hero.annually}
                <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold rounded-full">{tr.hero.annualSave}</span>
              </button>
            </div>
          </div>

          {/* Pricing cards */}
          <div className="grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tr.plans.map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-2xl p-8 transition-all ${
                  plan.highlight
                    ? 'bg-white/[0.04] border-2 border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.08)]'
                    : 'bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12]'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-emerald-500 text-black text-xs font-semibold rounded-full">
                      {lang === 'es' ? 'Más popular' : 'Most popular'}
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-gray-500 text-sm">{plan.desc}</p>
                </div>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      {annual ? plan.priceAnnual : plan.priceMonthly}
                    </span>
                    {!plan.isFree && plan.priceMonthly !== 'Custom' && (
                      <span className="text-gray-500 text-sm">{tr.perMonth}</span>
                    )}
                  </div>
                  {annual && !plan.isFree && plan.priceMonthly !== 'Custom' && (
                    <p className="text-emerald-400 text-xs mt-1">
                      {lang === 'es' ? 'facturado anualmente' : 'billed annually'}
                    </p>
                  )}
                </div>
                <Link
                  href={plan.priceMonthly === 'Custom' ? 'mailto:info@akademo.es' : '/?modal=register'}
                  className={`block w-full text-center py-3 rounded-lg font-medium text-sm transition-all mb-8 ${
                    plan.highlight
                      ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                      : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  {plan.cta}
                </Link>
                <ul className="space-y-3">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2.5 text-sm text-gray-300">
                      <CheckIcon className="text-emerald-400 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURE COMPARISON TABLE ─── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">{tr.compare.title}</h2>
            <p className="text-gray-400 text-sm sm:text-base">{tr.compare.subtitle}</p>
          </div>

          <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="bg-white/[0.03]">
                    <th className="py-4 px-5 text-left font-semibold text-gray-300 text-xs uppercase tracking-wider w-[40%]">&nbsp;</th>
                    <th className="py-4 px-5 text-center font-semibold text-gray-400 text-xs uppercase tracking-wider">Starter</th>
                    <th className="py-4 px-5 text-center font-semibold text-emerald-400 text-xs uppercase tracking-wider">Pro</th>
                    <th className="py-4 px-5 text-center font-semibold text-gray-400 text-xs uppercase tracking-wider">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {tr.compare.categories.map((cat, ci) => (
                    <>
                      <tr key={`cat-${ci}`} className="border-t border-white/[0.06]">
                        <td colSpan={4} className="py-3 px-5 text-xs font-semibold text-emerald-400 uppercase tracking-wider bg-white/[0.01]">
                          {cat.name}
                        </td>
                      </tr>
                      {cat.features.map((feat, fi) => (
                        <tr key={`feat-${ci}-${fi}`} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-5 text-gray-300">{feat.name}</td>
                          <td className="py-3 px-5 text-center"><div className="flex justify-center"><CellValue value={feat.starter} /></div></td>
                          <td className="py-3 px-5 text-center bg-emerald-500/[0.02]"><div className="flex justify-center"><CellValue value={feat.pro} /></div></td>
                          <td className="py-3 px-5 text-center"><div className="flex justify-center"><CellValue value={feat.enterprise} /></div></td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-center mb-12">{tr.faq.title}</h2>
          <div className="space-y-2">
            {tr.faq.items.map((faq, i) => (
              <div key={i} className="rounded-xl border border-white/[0.06] overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="font-medium text-gray-200 text-sm pr-4">{faq.q}</span>
                  <svg className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-gray-400 text-sm leading-relaxed border-t border-white/[0.04]">
                    <div className="pt-3">{faq.a}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
            {tr.cta.title1} <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{tr.cta.titleHighlight}</span>{tr.cta.title2}
          </h2>
          <p className="text-gray-400 text-base sm:text-lg mb-8 max-w-xl mx-auto">{tr.cta.subtitle}</p>
          <Link href="/?modal=register" className="inline-block px-8 py-3.5 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-all text-sm sm:text-base">
            {tr.cta.button}
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/[0.06] py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Image src="/logo/AKADEMO_logo_OTHER2.svg" alt="AKADEMO" width={100} height={28} className="h-6 w-auto brightness-0 invert" />
                <span className="font-bold text-lg">AKADEMO</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{tr.footer.tagline}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-200 mb-4">{tr.footer.product}</h4>
              <ul className="space-y-2.5">
                <li><Link href="/features" className="text-gray-500 hover:text-white text-sm transition-colors">{tr.footer.featuresLink}</Link></li>
                <li><Link href="/pricing" className="text-gray-500 hover:text-white text-sm transition-colors">{tr.footer.pricingLink}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-200 mb-4">{tr.footer.company}</h4>
              <ul className="space-y-2.5">
                <li><a href="mailto:info@akademo.es" className="text-gray-500 hover:text-white text-sm transition-colors">{tr.footer.contactLink}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-200 mb-4">{tr.footer.legal}</h4>
              <ul className="space-y-2.5">
                <li><a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">{tr.footer.privacyLink}</a></li>
                <li><a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">{tr.footer.termsLink}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/[0.06] pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-xs">{tr.footer.rights}</p>
            <div className="flex gap-4">
              <Link href="/features" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">{tr.footer.featuresLink}</Link>
              <Link href="/pricing" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">{tr.footer.pricingLink}</Link>
              <a href="mailto:info@akademo.es" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">{tr.footer.contactLink}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
