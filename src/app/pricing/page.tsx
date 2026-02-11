'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type Lang = 'es' | 'en';

const t = {
  es: {
    login: 'Iniciar Sesión',
    getStarted: 'Comenzar Gratis',
    features: 'Características',
    pricing: 'Precios',
    heroTitle: 'Precios simples y transparentes',
    heroSubtitle: 'Elige el plan que mejor se adapte a tu academia. Sin sorpresas. Sin letra pequeña.',
    monthly: 'Mensual',
    annually: 'Anual',
    annualDiscount: 'Ahorra 20%',
    perMonth: '/mes',
    mostPopular: 'Más popular',
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
        ],
      },
      {
        name: 'Pro',
        desc: 'Para academias consolidadas que necesitan control total.',
        priceMonthly: '€49',
        priceAnnual: '€39',
        isFree: false,
        cta: 'Comenzar Prueba',
        popular: true,
        features: [
          'Clases ilimitadas',
          'Estudiantes ilimitados',
          '100 GB de almacenamiento',
          'Protección anti-compartir avanzada',
          'Marca de agua dinámica personalizada',
          'Clases en directo (Zoom)',
          'Tareas y evaluaciones',
          'Gestión de pagos',
          'Analytics completos',
          'Soporte prioritario',
        ],
      },
      {
        name: 'Enterprise',
        desc: 'Para grandes academias con necesidades especiales.',
        priceMonthly: 'Contactar',
        priceAnnual: 'Contactar',
        isFree: false,
        isEnterprise: true,
        cta: 'Contactar Ventas',
        features: [
          'Todo lo de Pro',
          'Almacenamiento ilimitado',
          'Dominio personalizado',
          'API personalizada',
          'Onboarding dedicado',
          'SLA garantizado',
          'Soporte 24/7',
          'Migración asistida',
        ],
      },
    ],
    faqTitle: 'Preguntas sobre precios',
    faqs: [
      { q: '¿Puedo cambiar de plan en cualquier momento?', a: 'Sí, puedes subir o bajar de plan cuando quieras. El cambio se aplica inmediatamente y se prorratea el coste.' },
      { q: '¿Hay compromiso de permanencia?', a: 'No. Puedes cancelar en cualquier momento. Si cancelas, mantiendrás el acceso hasta el final del período facturado.' },
      { q: '¿Qué métodos de pago aceptáis?', a: 'Aceptamos tarjetas de crédito y débito (Visa, Mastercard, Amex) a través de Stripe. Para planes Enterprise, también transferencia bancaria.' },
      { q: '¿El plan Starter es realmente gratis?', a: 'Sí, completamente gratis sin límite de tiempo. Incluye las funcionalidades básicas de protección para que puedas probar la plataforma.' },
      { q: '¿Qué pasa si supero los límites de mi plan?', a: 'Te avisaremos cuando estés cerca del límite. Puedes subir de plan en cualquier momento para obtener más capacidad.' },
    ],
    ctaTitle: '¿No estás seguro de qué plan elegir?',
    ctaSubtitle: 'Habla con nuestro equipo y te ayudamos a encontrar la mejor opción para tu academia.',
    ctaButton: 'Hablar con Ventas',
    ctaAlt: 'O empieza gratis ahora',
    footerRights: '© 2025 AKADEMO. Todos los derechos reservados.',
    footerTagline: 'Protegiendo el conocimiento que creas.',
  },
  en: {
    login: 'Login',
    getStarted: 'Get Started Free',
    features: 'Features',
    pricing: 'Pricing',
    heroTitle: 'Simple, transparent pricing',
    heroSubtitle: 'Choose the plan that best fits your academy. No surprises. No fine print.',
    monthly: 'Monthly',
    annually: 'Annual',
    annualDiscount: 'Save 20%',
    perMonth: '/mo',
    mostPopular: 'Most popular',
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
        ],
      },
      {
        name: 'Pro',
        desc: 'For established academies that need full control.',
        priceMonthly: '€49',
        priceAnnual: '€39',
        isFree: false,
        cta: 'Start Trial',
        popular: true,
        features: [
          'Unlimited classes',
          'Unlimited students',
          '100 GB storage',
          'Advanced anti-sharing protection',
          'Custom dynamic watermark',
          'Live classes (Zoom)',
          'Assignments & grading',
          'Payment management',
          'Full analytics',
          'Priority support',
        ],
      },
      {
        name: 'Enterprise',
        desc: 'For large academies with special needs.',
        priceMonthly: 'Contact',
        priceAnnual: 'Contact',
        isFree: false,
        isEnterprise: true,
        cta: 'Contact Sales',
        features: [
          'Everything in Pro',
          'Unlimited storage',
          'Custom domain',
          'Custom API',
          'Dedicated onboarding',
          'Guaranteed SLA',
          '24/7 support',
          'Assisted migration',
        ],
      },
    ],
    faqTitle: 'Pricing questions',
    faqs: [
      { q: 'Can I change plans anytime?', a: 'Yes, you can upgrade or downgrade anytime. Changes apply immediately with prorated billing.' },
      { q: 'Is there a commitment?', a: 'No. You can cancel anytime. If you cancel, you\'ll keep access until the end of the billing period.' },
      { q: 'What payment methods do you accept?', a: 'We accept credit and debit cards (Visa, Mastercard, Amex) via Stripe. For Enterprise plans, also bank transfer.' },
      { q: 'Is the Starter plan really free?', a: 'Yes, completely free with no time limit. It includes basic protection features so you can try the platform.' },
      { q: 'What happens if I exceed my plan limits?', a: 'We\'ll notify you when you\'re close to the limit. You can upgrade anytime to get more capacity.' },
    ],
    ctaTitle: 'Not sure which plan to choose?',
    ctaSubtitle: 'Talk to our team and we\'ll help you find the best option for your academy.',
    ctaButton: 'Talk to Sales',
    ctaAlt: 'Or start free now',
    footerRights: '© 2025 AKADEMO. All rights reserved.',
    footerTagline: 'Protecting the knowledge you create.',
  },
};

export default function PricingPage() {
  const [lang, setLang] = useState<Lang>('es');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAnnual, setIsAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const tr = t[lang];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo/AKADEMO_logo_OTHER2.svg" alt="AKADEMO" width={140} height={36} className="h-7 sm:h-9 w-auto" />
            <span className={`text-lg sm:text-xl font-bold font-[family-name:var(--font-montserrat)] transition-colors ${isScrolled ? 'text-gray-900' : 'text-gray-900'}`}>AKADEMO</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/features" className={`hidden sm:inline text-sm font-medium transition-colors ${isScrolled ? 'text-gray-600 hover:text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>{tr.features}</Link>
            <Link href="/pricing" className={`hidden sm:inline text-sm font-medium transition-colors ${isScrolled ? 'text-gray-900' : 'text-gray-700'}`}>{tr.pricing}</Link>
            <Link href="/?modal=login" className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${isScrolled ? 'text-gray-600 hover:text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>
              {tr.login}
            </Link>
            <Link href="/?modal=register" className="px-3 sm:px-5 py-1.5 sm:py-2 bg-gray-900 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-gray-800 transition-all shadow-sm">
              {tr.getStarted}
            </Link>
          </div>
        </div>
        {/* Language switcher */}
        <div className="fixed top-3 sm:top-4 right-4 sm:right-6 z-50 flex gap-1.5">
          <button onClick={() => setLang('es')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all overflow-hidden shadow ${lang === 'es' ? 'bg-white scale-110 ring-2 ring-gray-300' : 'bg-white/70 hover:bg-white/90'}`} title="Español">
            <Image src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 600'%3E%3Cpath fill='%23c60b1e' d='M0 0h900v600H0z'/%3E%3Cpath fill='%23ffc400' d='M0 150h900v300H0z'/%3E%3C/svg%3E" alt="ES" width={20} height={20} unoptimized className="w-5 h-5" />
          </button>
          <button onClick={() => setLang('en')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all overflow-hidden shadow ${lang === 'en' ? 'bg-white scale-110 ring-2 ring-gray-300' : 'bg-white/70 hover:bg-white/90'}`} title="English">
            <Image src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 30'%3E%3Cpath fill='%23012169' d='M0 0h60v30H0z'/%3E%3Cpath stroke='%23fff' stroke-width='6' d='M0 0l60 30m0-30L0 30'/%3E%3Cpath stroke='%23C8102E' stroke-width='4' d='M0 0l60 30m0-30L0 30'/%3E%3Cpath stroke='%23fff' stroke-width='10' d='M30 0v30M0 15h60'/%3E%3Cpath stroke='%23C8102E' stroke-width='6' d='M30 0v30M0 15h60'/%3E%3C/svg%3E" alt="EN" width={20} height={20} unoptimized className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-28 sm:pt-36 pb-8 sm:pb-12 px-4 sm:px-6 bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight">{tr.heroTitle}</h1>
          <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto mb-8">{tr.heroSubtitle}</p>
          {/* Toggle */}
          <div className="inline-flex items-center gap-3 bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!isAnnual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              {tr.monthly}
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isAnnual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              {tr.annually}
              <span className="ml-1.5 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">{tr.annualDiscount}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-8 sm:py-16 px-4 sm:px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
            {tr.plans.map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-2xl p-6 sm:p-8 flex flex-col ${
                  plan.popular
                    ? 'bg-gray-900 text-white ring-2 ring-gray-900 shadow-2xl scale-[1.02]'
                    : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg'
                } transition-all`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-white text-gray-900 text-xs font-bold rounded-full shadow-lg">
                      {tr.mostPopular}
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className={`text-xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                  <p className={`text-sm leading-relaxed ${plan.popular ? 'text-gray-300' : 'text-gray-500'}`}>{plan.desc}</p>
                </div>
                <div className="mb-6">
                  {plan.isFree ? (
                    <div className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                      {isAnnual ? plan.priceAnnual : plan.priceMonthly}
                    </div>
                  ) : plan.isEnterprise ? (
                    <div className={`text-3xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                      {isAnnual ? plan.priceAnnual : plan.priceMonthly}
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                        {isAnnual ? plan.priceAnnual : plan.priceMonthly}
                      </span>
                      <span className={`text-sm ${plan.popular ? 'text-gray-400' : 'text-gray-400'}`}>{tr.perMonth}</span>
                    </div>
                  )}
                </div>
                <Link
                  href={plan.isEnterprise ? 'mailto:info@akademo.es' : '/?modal=register'}
                  className={`block text-center px-6 py-3 rounded-xl font-medium text-sm transition-all mb-6 ${
                    plan.popular
                      ? 'bg-white text-gray-900 hover:bg-gray-100'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {plan.cta}
                </Link>
                <ul className="space-y-3 flex-1">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2.5">
                      <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-green-400' : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={`text-sm ${plan.popular ? 'text-gray-200' : 'text-gray-600'}`}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-10 text-center">{tr.faqTitle}</h2>
          <div className="space-y-3">
            {tr.faqs.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900 text-sm sm:text-base pr-4">{faq.q}</span>
                  <svg className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-gray-500 text-sm leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{tr.ctaTitle}</h2>
          <p className="text-gray-500 text-base sm:text-lg mb-8">{tr.ctaSubtitle}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="mailto:info@akademo.es" className="px-8 py-3.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium text-sm sm:text-base transition-all shadow-lg text-center">
              {tr.ctaButton}
            </a>
            <Link href="/?modal=register" className="px-8 py-3.5 bg-white text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium text-sm sm:text-base transition-all text-center">
              {tr.ctaAlt}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
            <div>
              <span className="font-bold text-white text-lg">AKADEMO</span>
              <p className="text-gray-400 text-sm leading-relaxed mt-3">{tr.footerTagline}</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">{lang === 'es' ? 'Producto' : 'Product'}</h4>
              <ul className="space-y-2">
                <li><Link href="/features" className="text-gray-400 hover:text-white text-sm transition-colors">{lang === 'es' ? 'Características' : 'Features'}</Link></li>
                <li><Link href="/pricing" className="text-gray-400 hover:text-white text-sm transition-colors">{lang === 'es' ? 'Precios' : 'Pricing'}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">{lang === 'es' ? 'Compañía' : 'Company'}</h4>
              <ul className="space-y-2">
                <li><a href="mailto:info@akademo.es" className="text-gray-400 hover:text-white text-sm transition-colors">{lang === 'es' ? 'Contacto' : 'Contact'}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">{lang === 'es' ? 'Privacidad' : 'Privacy'}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">{lang === 'es' ? 'Términos' : 'Terms'}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6">
            <p className="text-gray-500 text-sm text-center">{tr.footerRights}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
