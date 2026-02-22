'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type Lang = 'es' | 'en';

// â”€â”€â”€ TRANSLATIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const t = {
  es: {
    nav: { pricing: 'Precios', login: 'Iniciar SesiÃ³n', cta: 'Solicitar acceso' },
    hero: {
      badge: 'Un solo plan. Todo incluido.',
      title: 'Precio simple para academias serias.',
      subtitle: 'Sin tiers, sin sorpresas. Acceso completo a toda la plataforma desde el primer dÃ­a.',
    },
    plan: {
      name: 'Todo incluido',
      price: 'â‚¬499',
      perMonth: '/mes',
      desc: 'Para academias que quieren proteger su contenido, gestionar estudiantes y escalar sin lÃ­mites.',
      cta: 'Solicitar acceso',
      features: [
        { label: 'Clases y estudiantes ilimitados', group: 'Plataforma' },
        { label: 'Streaming seguro con BunnyCDN', group: 'Plataforma' },
        { label: 'Clases en directo con Zoom', group: 'Plataforma' },
        { label: 'Dashboard completo y analÃ­ticas', group: 'Plataforma' },
        { label: 'GestiÃ³n de pagos con Stripe', group: 'Plataforma' },
        { label: 'Firma y distribuciÃ³n de documentos', group: 'Plataforma' },
        { label: 'Anti-compartir de cuentas', group: 'ProtecciÃ³n' },
        { label: 'Marca de agua dinÃ¡mica en vÃ­deos', group: 'ProtecciÃ³n' },
        { label: 'DetecciÃ³n de viaje imposible', group: 'ProtecciÃ³n' },
        { label: 'Control de tiempo de visualizaciÃ³n', group: 'ProtecciÃ³n' },
        { label: 'Soporte prioritario por email', group: 'Soporte' },
        { label: 'Onboarding personalizado', group: 'Soporte' },
      ],
    },
    guarantee: {
      title: 'Sin compromisos',
      items: [
        { icon: 'ðŸš«', text: 'Sin permanencia â€” cancela cuando quieras' },
        { icon: 'ðŸ’³', text: 'Cobro mensual, sin contrato anual obligatorio' },
        { icon: 'ðŸ“¦', text: 'Todos tus datos exportables en cualquier momento' },
      ],
    },
    faq: {
      title: 'Preguntas frecuentes',
      items: [
        { q: 'Â¿Hay algÃºn lÃ­mite de estudiantes o clases?', a: 'No. El plan incluye clases y estudiantes ilimitados. Sin caps artificiales.' },
        { q: 'Â¿Puedo cancelar en cualquier momento?', a: 'SÃ­, sin penalizaciÃ³n. Si cancelas, mantienes el acceso hasta final del perÃ­odo pagado.' },
        { q: 'Â¿CÃ³mo funciona el onboarding?', a: 'Al activar tu cuenta te ponemos en contacto con nuestro equipo para configurar tu academia, migrar contenido y resolver dudas.' },
        { q: 'Â¿QuÃ© mÃ©todos de pago aceptÃ¡is?', a: 'Tarjeta de crÃ©dito/dÃ©bito a travÃ©s de Stripe. FacturaciÃ³n bancaria disponible bajo peticiÃ³n.' },
        { q: 'Â¿El precio incluye BunnyCDN y Zoom?', a: 'SÃ­. El coste del streaming seguro con Bunny y las clases en directo con Zoom estÃ¡ incluido en el precio mensual.' },
      ],
    },
    cta: {
      title: 'Â¿Lista tu academia para el siguiente nivel?',
      subtitle: 'Solicita acceso y empieza a proteger tu contenido esta semana.',
      button: 'Solicitar acceso',
    },
    footer: {
      tagline: 'Plataforma de protecciÃ³n y gestiÃ³n para academias online.',
      rights: 'Â© 2025 AKADEMO. Todos los derechos reservados.',
    },
  },
  en: {
    nav: { pricing: 'Pricing', login: 'Login', cta: 'Request access' },
    hero: {
      badge: 'One plan. Everything included.',
      title: 'Simple pricing for serious academies.',
      subtitle: 'No tiers, no surprises. Full platform access from day one.',
    },
    plan: {
      name: 'All-inclusive',
      price: 'â‚¬499',
      perMonth: '/mo',
      desc: 'For academies that want to protect their content, manage students, and scale without limits.',
      cta: 'Request access',
      features: [
        { label: 'Unlimited classes and students', group: 'Platform' },
        { label: 'Secure streaming with BunnyCDN', group: 'Platform' },
        { label: 'Live classes with Zoom', group: 'Platform' },
        { label: 'Full dashboard and analytics', group: 'Platform' },
        { label: 'Payment management with Stripe', group: 'Platform' },
        { label: 'Document signing and distribution', group: 'Platform' },
        { label: 'Account sharing prevention', group: 'Protection' },
        { label: 'Dynamic video watermarking', group: 'Protection' },
        { label: 'Impossible travel detection', group: 'Protection' },
        { label: 'Video watch time control', group: 'Protection' },
        { label: 'Priority email support', group: 'Support' },
        { label: 'Personalized onboarding', group: 'Support' },
      ],
    },
    guarantee: {
      title: 'No commitments',
      items: [
        { icon: 'ðŸš«', text: 'No lock-in â€” cancel anytime' },
        { icon: 'ðŸ’³', text: 'Monthly billing, no mandatory annual contract' },
        { icon: 'ðŸ“¦', text: 'All your data exportable at any time' },
      ],
    },
    faq: {
      title: 'Frequently asked questions',
      items: [
        { q: 'Is there a limit on students or classes?', a: 'No. The plan includes unlimited classes and students. No artificial caps.' },
        { q: 'Can I cancel at any time?', a: 'Yes, with no penalty. If you cancel, you keep access until the end of the paid period.' },
        { q: 'How does onboarding work?', a: "When you activate your account, our team contacts you to set up your academy, migrate content, and answer questions." },
        { q: 'What payment methods do you accept?', a: 'Credit/debit card via Stripe. Bank invoicing available on request.' },
        { q: 'Does the price include BunnyCDN and Zoom?', a: 'Yes. The cost of secure streaming with Bunny and live classes with Zoom is included in the monthly price.' },
      ],
    },
    cta: {
      title: 'Ready to take your academy to the next level?',
      subtitle: 'Request access and start protecting your content this week.',
      button: 'Request access',
    },
    footer: {
      tagline: 'Protection and management platform for online academies.',
      rights: 'Â© 2025 AKADEMO. All rights reserved.',
    },
  },
};

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

export default function PricingPage() {
  const [lang, setLang] = useState<Lang>('es');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const tr = t[lang];

  const groups = tr.plan.features.map(f => f.group).filter((g, i, arr) => arr.indexOf(g) === i);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* â”€â”€â”€ NAVBAR (glass pill matching landing) â”€â”€â”€ */}
      <header className="fixed top-0 left-0 right-0 z-40">
        <div className="mx-3 sm:mx-6 mt-3 sm:mt-4">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg bg-white/10 border border-white/20">
            <div className="flex justify-between items-center">
              <Link href="/" className="flex items-center gap-2">
                <Image src="/logo/AKADEMO_logo_OTHER2.svg" alt="AKADEMO" width={140} height={36} className="h-7 sm:h-9 w-auto brightness-0 invert" />
                <span className="text-lg sm:text-xl font-bold text-white font-[family-name:var(--font-montserrat)]">AKADEMO</span>
              </Link>
              <div className="flex items-center gap-1.5 sm:gap-3">
                <Link href="/?modal=login" className="px-2.5 sm:px-4 py-1.5 sm:py-2 font-medium text-xs sm:text-sm text-white/90 hover:text-white transition-colors whitespace-nowrap">
                  {tr.nav.login}
                </Link>
                <Link href="/?modal=register" className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm bg-white text-gray-900 hover:bg-white/90 transition-all shadow-sm whitespace-nowrap">
                  {tr.nav.cta}
                </Link>
              </div>
            </div>
          </div>
        </div>
        {/* Lang switcher */}
        <div className="fixed top-20 sm:top-6 right-4 sm:right-6 z-50 flex gap-1.5">
          <button onClick={() => setLang('es')} className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all overflow-hidden shadow-lg ${lang === 'es' ? 'bg-white scale-110' : 'bg-white/70 hover:bg-white/90 backdrop-blur'}`} title="EspaÃ±ol">
            <Image src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 600'%3E%3Cpath fill='%23c60b1e' d='M0 0h900v600H0z'/%3E%3Cpath fill='%23ffc400' d='M0 150h900v300H0z'/%3E%3C/svg%3E" alt="ES" width={24} height={24} unoptimized className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button onClick={() => setLang('en')} className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all overflow-hidden shadow-lg ${lang === 'en' ? 'bg-white scale-110' : 'bg-white/70 hover:bg-white/90 backdrop-blur'}`} title="English">
            <Image src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 30'%3E%3Cpath fill='%23012169' d='M0 0h60v30H0z'/%3E%3Cpath stroke='%23fff' stroke-width='6' d='M0 0l60 30m0-30L0 30'/%3E%3Cpath stroke='%23C8102E' stroke-width='4' d='M0 0l60 30m0-30L0 30'/%3E%3Cpath stroke='%23fff' stroke-width='10' d='M30 0v30M0 15h60'/%3E%3Cpath stroke='%23C8102E' stroke-width='6' d='M30 0v30M0 15h60'/%3E%3C/svg%3E" alt="EN" width={24} height={24} unoptimized className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </header>

      {/* â”€â”€â”€ HERO â”€â”€â”€ */}
      <section className="relative pt-36 sm:pt-44 pb-20 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            {tr.hero.badge}
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight mb-5">
            {tr.hero.title}
          </h1>
          <p className="text-base sm:text-lg text-gray-400 max-w-xl mx-auto">{tr.hero.subtitle}</p>
        </div>
      </section>

      {/* â”€â”€â”€ PRICING CARD â”€â”€â”€ */}
      <section className="pb-24 px-4 sm:px-6">
        <div className="max-w-xl mx-auto">
          <div className="relative rounded-2xl p-8 sm:p-10 bg-white/[0.04] border-2 border-emerald-500/40 shadow-[0_0_60px_rgba(16,185,129,0.1)]">
            {/* Popular badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1.5 bg-emerald-500 text-black text-xs font-bold rounded-full uppercase tracking-wide">
                {lang === 'es' ? 'Acceso completo' : 'Full access'}
              </span>
            </div>

            {/* Plan header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-1">{tr.plan.name}</h2>
              <p className="text-gray-400 text-sm">{tr.plan.desc}</p>
            </div>

            {/* Price */}
            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-6xl font-bold tracking-tight">{tr.plan.price}</span>
              <span className="text-gray-400 text-lg">{tr.plan.perMonth}</span>
            </div>

            {/* CTA */}
            <Link
              href="/?modal=register"
              className="block w-full text-center py-3.5 rounded-xl font-semibold text-sm sm:text-base bg-emerald-500 text-black hover:bg-emerald-400 transition-all mb-8 shadow-lg shadow-emerald-500/20"
            >
              {tr.plan.cta}
            </Link>

            {/* Features grouped */}
            <div className="space-y-6">
              {groups.map(group => (
                <div key={group}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-3">{group}</p>
                  <ul className="space-y-2.5">
                    {tr.plan.features.filter(f => f.group === group).map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                        <CheckIcon />
                        {f.label}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€â”€ GUARANTEES â”€â”€â”€ */}
      <section className="py-16 px-4 sm:px-6 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center text-2xl font-bold mb-10">{tr.guarantee.title}</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {tr.guarantee.items.map((item, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 text-center">
                <div className="text-3xl mb-3">{item.icon}</div>
                <p className="text-sm text-gray-300 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€â”€ FAQ â”€â”€â”€ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
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

      {/* â”€â”€â”€ CTA â”€â”€â”€ */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
            {tr.cta.title}
          </h2>
          <p className="text-gray-400 text-base sm:text-lg mb-8">{tr.cta.subtitle}</p>
          <Link href="/?modal=register" className="inline-block px-8 py-3.5 bg-emerald-500 text-black font-semibold rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">
            {tr.cta.button}
          </Link>
        </div>
      </section>

      {/* â”€â”€â”€ FOOTER â”€â”€â”€ */}
      <footer className="border-t border-white/[0.06] py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo/AKADEMO_logo_OTHER2.svg" alt="AKADEMO" width={100} height={28} className="h-6 w-auto brightness-0 invert" />
            <span className="font-bold">AKADEMO</span>
          </div>
          <p className="text-gray-500 text-xs text-center">{tr.footer.tagline}</p>
          <p className="text-gray-600 text-xs">{tr.footer.rights}</p>
        </div>
      </footer>
    </div>
  );
}
