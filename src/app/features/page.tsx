'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type Lang = 'es' | 'en';

const t = {
  es: {
    // Navbar
    login: 'Iniciar Sesión',
    getStarted: 'Comenzar Gratis',
    features: 'Características',
    pricing: 'Precios',
    // Hero
    heroBadge: 'La plataforma todo-en-uno para academias',
    heroTitle: 'Deja de perder dinero por contenido compartido',
    heroSubtitle: 'AKADEMO protege tus vídeos, controla el acceso de tus estudiantes y gestiona toda tu academia desde un solo lugar.',
    heroCta: 'Empieza Gratis',
    heroSecondaryCta: 'Ver Precios',
    // Problem Section
    problemTitle: '¿Te suena familiar?',
    problemSubtitle: 'Estos son los problemas reales que enfrentan las academias cada día.',
    problems: [
      { stat: '€5,000+', label: 'perdidos al año', desc: 'por cuentas compartidas entre estudiantes que no pagan' },
      { stat: '40+', label: 'horas al mes', desc: 'gestionando estudiantes, pagos y contenido en hojas de cálculo' },
      { stat: '73%', label: 'de academias', desc: 'no saben quién comparte sus vídeos ni cómo detenerlo' },
    ],
    // Features
    featuresTitle: 'Todo lo que tu academia necesita',
    featuresSubtitle: 'Una plataforma diseñada por y para academias. Sin compromisos.',
    featuresList: [
      { icon: '🛡️', title: 'Protección Anti-Compartir', desc: 'Una sesión activa por estudiante. Si alguien comparte sus credenciales, la otra sesión se cierra automáticamente.' },
      { icon: '🎬', title: 'Streaming Seguro', desc: 'Tus vídeos se transmiten protegidos. Sin botón de descarga. Con marca de agua dinámica personalizada.' },
      { icon: '👁️', title: 'Marca de Agua Dinámica', desc: 'Cada vídeo muestra el nombre y email del estudiante. Si alguien filtra tu contenido, sabrás quién fue.' },
      { icon: '📊', title: 'Dashboard Completo', desc: 'Métricas en tiempo real: asistencia, progreso, valoraciones, pagos. Todo visible de un vistazo.' },
      { icon: '🎥', title: 'Clases en Directo', desc: 'Transmite en vivo con integración Zoom. Graba automáticamente y protege las grabaciones.' },
      { icon: '📝', title: 'Tareas y Evaluaciones', desc: 'Asigna trabajos, recibe entregas y califica. Todo integrado en la plataforma.' },
      { icon: '💳', title: 'Gestión de Pagos', desc: 'Controla quién ha pagado, envía recordatorios y bloquea acceso a morosos automáticamente.' },
      { icon: '👥', title: 'Roles y Permisos', desc: 'Academia, Profesores y Estudiantes con accesos claramente definidos y jerarquía de permisos.' },
      { icon: '📱', title: 'Responsive y Moderno', desc: 'Funciona perfectamente en móvil, tablet y escritorio. Interfaz limpia y profesional.' },
    ],
    // Before/After
    comparisonTitle: 'Antes vs. Después de AKADEMO',
    comparisonSubtitle: 'La diferencia es clara.',
    comparisonHeaders: ['', 'Sin AKADEMO', 'Con AKADEMO'],
    comparisonRows: [
      ['Cuentas compartidas', 'Sin control, pierdes dinero', 'Bloqueadas automáticamente'],
      ['Contenido protegido', 'Descargas y filtraciones', 'Streaming seguro + marca de agua'],
      ['Gestión de estudiantes', 'Excel y correos manuales', 'Dashboard centralizado'],
      ['Pagos', 'Perseguir uno a uno', 'Control automático de acceso'],
      ['Valoraciones', 'Sin feedback', 'Sistema de valoraciones por lección'],
      ['Clases en directo', 'Zoom sin protección', 'Integrado y protegido con grabación'],
    ],
    // How it works
    howTitle: '¿Cómo funciona?',
    howSubtitle: 'En 3 pasos sencillos.',
    howSteps: [
      { num: '01', title: 'Crea tu academia', desc: 'Regístrate gratis, configura tu academia y añade tus profesores.' },
      { num: '02', title: 'Sube tu contenido', desc: 'Crea clases, sube vídeos protegidos y organiza por temas.' },
      { num: '03', title: 'Inscribe estudiantes', desc: 'Tus estudiantes acceden al contenido protegido. Tú controlas todo.' },
    ],
    // FAQ
    faqTitle: 'Preguntas Frecuentes',
    faqs: [
      { q: '¿Cómo funciona la protección anti-compartir?', a: 'Cada estudiante solo puede tener una sesión activa. Si alguien inicia sesión desde otro dispositivo, la sesión anterior se cierra automáticamente. Además, monitoreamos patrones sospechosos de acceso.' },
      { q: '¿Qué pasa si un estudiante graba la pantalla?', a: 'Cada vídeo muestra una marca de agua dinámica con el nombre y email del estudiante. Si aparece un vídeo filtrado, puedes identificar exactamente quién lo grabó.' },
      { q: '¿Puedo usar mi propio dominio?', a: 'Actualmente la plataforma funciona bajo el dominio de AKADEMO. Estamos trabajando en dominios personalizados para planes Enterprise.' },
      { q: '¿Hay límite de vídeos o estudiantes?', a: 'Depende del plan. El plan gratuito incluye funcionalidades básicas. Los planes de pago ofrecen almacenamiento ilimitado y sin límite de estudiantes.' },
      { q: '¿Cómo funcionan las clases en directo?', a: 'Se integra con Zoom. Puedes programar y lanzar clases en directo desde el panel. Las sesiones se graban automáticamente y quedan protegidas en la plataforma.' },
      { q: '¿Puedo migrar mi academia desde otra plataforma?', a: 'Sí. Nuestro equipo te ayuda con la migración de contenido y estudiantes. Contacta con nosotros para un plan personalizado.' },
    ],
    // CTA
    ctaTitle: '¿Listo para proteger tu academia?',
    ctaSubtitle: 'Empieza gratis. Sin tarjeta de crédito. Sin compromisos.',
    ctaButton: 'Crear Mi Academia Gratis',
    // Footer
    footerRights: '© 2025 AKADEMO. Todos los derechos reservados.',
    footerTagline: 'Protegiendo el conocimiento que creas.',
  },
  en: {
    login: 'Login',
    getStarted: 'Get Started Free',
    features: 'Features',
    pricing: 'Pricing',
    heroBadge: 'The all-in-one platform for academies',
    heroTitle: 'Stop losing money to shared accounts',
    heroSubtitle: 'AKADEMO protects your videos, controls student access, and manages your entire academy from one place.',
    heroCta: 'Start Free',
    heroSecondaryCta: 'See Pricing',
    problemTitle: 'Sound familiar?',
    problemSubtitle: 'These are the real problems academies face every day.',
    problems: [
      { stat: '€5,000+', label: 'lost per year', desc: 'from shared accounts among students who don\'t pay' },
      { stat: '40+', label: 'hours per month', desc: 'managing students, payments and content in spreadsheets' },
      { stat: '73%', label: 'of academies', desc: 'don\'t know who shares their videos or how to stop it' },
    ],
    featuresTitle: 'Everything your academy needs',
    featuresSubtitle: 'A platform designed by and for academies. No compromises.',
    featuresList: [
      { icon: '🛡️', title: 'Anti-Sharing Protection', desc: 'One active session per student. If someone shares credentials, the other session closes automatically.' },
      { icon: '🎬', title: 'Secure Streaming', desc: 'Your videos stream protected. No download button. With personalized dynamic watermark.' },
      { icon: '👁️', title: 'Dynamic Watermark', desc: 'Every video shows the student\'s name and email. If someone leaks your content, you\'ll know who.' },
      { icon: '📊', title: 'Complete Dashboard', desc: 'Real-time metrics: attendance, progress, ratings, payments. Everything visible at a glance.' },
      { icon: '🎥', title: 'Live Classes', desc: 'Broadcast live with Zoom integration. Automatically record and protect the recordings.' },
      { icon: '📝', title: 'Assignments & Grading', desc: 'Assign work, receive submissions and grade. All integrated in the platform.' },
      { icon: '💳', title: 'Payment Management', desc: 'Track who has paid, send reminders and automatically block access for non-payers.' },
      { icon: '👥', title: 'Roles & Permissions', desc: 'Academy, Teachers and Students with clearly defined access levels and permission hierarchy.' },
      { icon: '📱', title: 'Responsive & Modern', desc: 'Works perfectly on mobile, tablet and desktop. Clean and professional interface.' },
    ],
    comparisonTitle: 'Before vs. After AKADEMO',
    comparisonSubtitle: 'The difference is clear.',
    comparisonHeaders: ['', 'Without AKADEMO', 'With AKADEMO'],
    comparisonRows: [
      ['Account sharing', 'No control, losing money', 'Automatically blocked'],
      ['Content protection', 'Downloads and leaks', 'Secure streaming + watermark'],
      ['Student management', 'Excel and manual emails', 'Centralized dashboard'],
      ['Payments', 'Chasing one by one', 'Automatic access control'],
      ['Ratings', 'No feedback', 'Per-lesson rating system'],
      ['Live classes', 'Unprotected Zoom', 'Integrated and protected with recording'],
    ],
    howTitle: 'How does it work?',
    howSubtitle: 'In 3 simple steps.',
    howSteps: [
      { num: '01', title: 'Create your academy', desc: 'Sign up free, configure your academy and add your teachers.' },
      { num: '02', title: 'Upload your content', desc: 'Create classes, upload protected videos and organize by topics.' },
      { num: '03', title: 'Enroll students', desc: 'Your students access protected content. You control everything.' },
    ],
    faqTitle: 'Frequently Asked Questions',
    faqs: [
      { q: 'How does anti-sharing protection work?', a: 'Each student can only have one active session. If someone logs in from another device, the previous session closes automatically. We also monitor suspicious access patterns.' },
      { q: 'What if a student records the screen?', a: 'Every video shows a dynamic watermark with the student\'s name and email. If a leaked video appears, you can identify exactly who recorded it.' },
      { q: 'Can I use my own domain?', a: 'Currently the platform runs under AKADEMO\'s domain. We\'re working on custom domains for Enterprise plans.' },
      { q: 'Is there a limit on videos or students?', a: 'Depends on the plan. The free plan includes basic features. Paid plans offer unlimited storage and no student limits.' },
      { q: 'How do live classes work?', a: 'It integrates with Zoom. You can schedule and launch live classes from the panel. Sessions are automatically recorded and protected on the platform.' },
      { q: 'Can I migrate my academy from another platform?', a: 'Yes. Our team helps you with content and student migration. Contact us for a personalized plan.' },
    ],
    ctaTitle: 'Ready to protect your academy?',
    ctaSubtitle: 'Start free. No credit card. No commitments.',
    ctaButton: 'Create My Academy Free',
    footerRights: '© 2025 AKADEMO. All rights reserved.',
    footerTagline: 'Protecting the knowledge you create.',
  },
};

export default function FeaturesPage() {
  const [lang, setLang] = useState<Lang>('es');
  const [isScrolled, setIsScrolled] = useState(false);
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
            <Link href="/features" className={`hidden sm:inline text-sm font-medium transition-colors ${isScrolled ? 'text-gray-900' : 'text-gray-700'}`}>{tr.features}</Link>
            <Link href="/pricing" className={`hidden sm:inline text-sm font-medium transition-colors ${isScrolled ? 'text-gray-600 hover:text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>{tr.pricing}</Link>
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

      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-900/5 rounded-full text-gray-600 text-xs sm:text-sm font-medium mb-6 border border-gray-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            {tr.heroBadge}
          </p>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
            {tr.heroTitle}
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            {tr.heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/?modal=register" className="px-8 py-3.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium text-sm sm:text-base transition-all shadow-lg text-center">
              {tr.heroCta}
            </Link>
            <Link href="/pricing" className="px-8 py-3.5 bg-white text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium text-sm sm:text-base transition-all text-center">
              {tr.heroSecondaryCta}
            </Link>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4">{tr.problemTitle}</h2>
            <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto">{tr.problemSubtitle}</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
            {tr.problems.map((p, i) => (
              <div key={i} className="text-center p-8 rounded-2xl bg-red-50/60 border border-red-100">
                <div className="text-4xl sm:text-5xl font-bold text-red-600 mb-2">{p.stat}</div>
                <div className="text-sm font-semibold text-red-500 uppercase tracking-wide mb-3">{p.label}</div>
                <p className="text-gray-600 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4">{tr.featuresTitle}</h2>
            <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto">{tr.featuresSubtitle}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tr.featuresList.map((f, i) => (
              <div key={i} className="p-6 sm:p-8 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all group">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before vs After Comparison */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4">{tr.comparisonTitle}</h2>
            <p className="text-gray-500 text-base sm:text-lg">{tr.comparisonSubtitle}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  {tr.comparisonHeaders.map((h, i) => (
                    <th key={i} className={`py-4 px-4 text-left font-semibold ${i === 0 ? 'text-gray-900' : i === 1 ? 'text-red-500' : 'text-green-600'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tr.comparisonRows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-4 px-4 font-medium text-gray-900">{row[0]}</td>
                    <td className="py-4 px-4 text-red-500">
                      <span className="inline-flex items-center gap-1.5">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        {row[1]}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-green-600">
                      <span className="inline-flex items-center gap-1.5">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {row[2]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4">{tr.howTitle}</h2>
            <p className="text-gray-500 text-base sm:text-lg">{tr.howSubtitle}</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {tr.howSteps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 text-white rounded-2xl text-xl font-bold mb-6">
                  {step.num}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
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
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gray-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">{tr.ctaTitle}</h2>
          <p className="text-gray-400 text-base sm:text-lg mb-8">{tr.ctaSubtitle}</p>
          <Link href="/?modal=register" className="inline-block px-8 py-3.5 bg-white text-gray-900 rounded-xl hover:bg-gray-100 font-medium text-sm sm:text-base transition-all shadow-lg">
            {tr.ctaButton}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 bg-gray-950">
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
