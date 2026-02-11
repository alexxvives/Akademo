'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type Lang = 'es' | 'en';

const t = {
  es: {
    nav: { features: 'Características', pricing: 'Precios', login: 'Iniciar Sesión', cta: 'Empieza Gratis' },
    hero: {
      badge: 'Plataforma Exclusiva para Academias',
      title1: 'Deja de perder dinero.',
      title2: 'Protege tu academia con tecnología.',
      subtitle: 'La infraestructura que tu academia necesita para proteger su contenido, prevenir cuentas compartidas y gestionar todo desde un solo lugar.',
      cta: 'Empieza Gratis',
      cta2: 'Ver Precios',
      tags: ['Sin tarjeta de crédito', 'Gratis para empezar', 'Cancela cuando quieras'],
    },
    problem: {
      label: 'EL PROBLEMA',
      title1: 'La educación online está',
      titleHighlight: 'rota',
      title2: 'para las academias',
      subtitle: 'Mientras las grandes plataformas tienen equipos enteros de seguridad, tú luchas solo contra la piratería de tu contenido.',
      stats: [
        { value: '€5,000+', label: 'Perdidos al año', desc: 'por cuentas compartidas entre estudiantes que no pagan.' },
        { value: '40+', label: 'Horas al mes', desc: 'gestionando estudiantes, pagos y contenido en hojas de cálculo.' },
        { value: '73%', label: 'De academias', desc: 'no saben quién comparte sus vídeos ni cómo detenerlo.' },
      ],
      painPoints: [
        'Contenido descargado y revendido',
        'Costes de adquisición cada vez mayores',
        'Competidores usando tu propio material',
      ],
      solution: '¿Y si hubiera una forma mejor?',
    },
    features: {
      label: 'CARACTERÍSTICAS',
      title1: 'Todo lo que necesitas en',
      titleHighlight: 'un solo lugar',
      subtitle: 'Un centro de mando unificado para toda tu academia. Sin cambiar entre plataformas.',
      list: [
        { icon: '🛡️', title: 'Anti-Compartir', desc: 'Una sesión activa por estudiante. Bloqueo automático de cuentas compartidas.' },
        { icon: '🎬', title: 'Streaming Seguro', desc: 'Vídeos protegidos sin botón de descarga. Transmisión cifrada.' },
        { icon: '👁️', title: 'Marca de Agua', desc: 'Nombre y email del estudiante visibles en cada vídeo.' },
        { icon: '📊', title: 'Dashboard', desc: 'Métricas en tiempo real de asistencia, progreso y pagos.' },
        { icon: '🎥', title: 'Clases en Directo', desc: 'Integración Zoom con grabación automática protegida.' },
        { icon: '📝', title: 'Tareas', desc: 'Asigna trabajos, recibe entregas y califica integrado.' },
        { icon: '💳', title: 'Gestión de Pagos', desc: 'Controla quién ha pagado. Bloqueo automático a morosos.' },
        { icon: '👥', title: 'Roles y Permisos', desc: 'Academia, profesores y estudiantes con accesos definidos.' },
        { icon: '📱', title: 'Mobile-First', desc: 'Funciona perfectamente en móvil, tablet y escritorio.' },
      ],
    },
    comparison: {
      label: 'LA DIFERENCIA',
      title1: 'Academias',
      titleBefore: 'Antes',
      titleVs: 'vs',
      titleAfter: 'Después',
      title2: 'de AKADEMO',
      subtitle: 'Deja de conformarte con métodos obsoletos. Mira por qué las academias están cambiando.',
      headers: ['Funcionalidad', 'Sin AKADEMO', 'Con AKADEMO'],
      rows: [
        ['Cuentas compartidas', 'Sin control, pierdes dinero', 'Bloqueadas automáticamente'],
        ['Protección de contenido', 'Descargas y filtraciones', 'Streaming seguro + marca de agua'],
        ['Gestión de estudiantes', 'Excel y correos manuales', 'Dashboard centralizado'],
        ['Control de pagos', 'Perseguir uno a uno', 'Acceso automático por pago'],
        ['Valoraciones', 'Sin feedback', 'Sistema por lección y tema'],
        ['Clases en directo', 'Zoom sin protección', 'Integrado con grabación protegida'],
      ],
      cta: 'Empieza a transformar tu academia',
    },
    product: {
      label: 'LA SOLUCIÓN',
      title1: 'Conoce tu',
      titleHighlight: 'plataforma completa',
      subtitle: 'Todo lo que necesitas para proteger y gestionar tu academia. Sin ser experto en tecnología.',
      items: [
        { badge: 'Protección', icon: '🛡️', title: 'Protección Anti-Compartir', desc: 'Tu vigilante de seguridad 24/7. Bloqueo automático de sesiones múltiples y detección de patrones sospechosos.', features: ['Una sesión activa por estudiante', 'Detección de patrones sospechosos', 'Alertas en tiempo real', 'Historial de accesos', 'Bloqueo automático'] },
        { badge: 'Contenido', icon: '🎬', title: 'Streaming Protegido', desc: 'Tus vídeos transmitidos con cifrado. Sin descargas. Con marca de agua personalizada.', features: ['Sin botón de descarga', 'Marca de agua dinámica', 'Cifrado de transmisión', 'Control de reproducción', 'Protección anti-grabación'] },
        { badge: 'Gestión', icon: '📊', title: 'Dashboard Completo', desc: 'Todo en un vistazo: estudiantes, clases, pagos, asistencia, valoraciones.', features: ['Métricas en tiempo real', 'Seguimiento de progreso', 'Gestión de pagos', 'Informes descargables', 'Vista por clase o global'] },
        { badge: 'En Directo', icon: '🎥', title: 'Clases en Directo', desc: 'Transmite en vivo con Zoom integrado. Grabación automática protegida.', features: ['Integración Zoom nativa', 'Grabación automática', 'Protección de grabaciones', 'Estadísticas de asistencia', 'Multi-academia'] },
        { badge: 'Evaluación', icon: '📝', title: 'Tareas y Evaluaciones', desc: 'Asigna, recibe y califica trabajos. Todo integrado sin salir de la plataforma.', features: ['Creación de tareas', 'Entrega de trabajos', 'Sistema de calificación', 'Fechas límite', 'Notificaciones automáticas'] },
        { badge: 'Roles', icon: '👥', title: 'Roles y Permisos', desc: 'Academia, Profesores, Estudiantes. Cada uno ve exactamente lo que necesita.', features: ['Gestión de profesores', 'Inscripciones controladas', 'Permisos granulares', 'Vista por rol', 'Colaboración entre profes'] },
      ],
    },
    faq: {
      title: 'Preguntas Frecuentes',
      subtitle: 'Todo lo que necesitas saber sobre AKADEMO. ¿No encuentras lo que buscas? Escríbenos.',
      items: [
        { q: '¿Cómo funciona la protección anti-compartir?', a: 'Cada estudiante solo puede tener una sesión activa. Si alguien inicia sesión desde otro dispositivo, la sesión anterior se cierra automáticamente. Además, monitoreamos patrones sospechosos de acceso.' },
        { q: '¿Qué pasa si un estudiante graba la pantalla?', a: 'Cada vídeo muestra una marca de agua dinámica con el nombre y email del estudiante. Si aparece un vídeo filtrado, puedes identificar exactamente quién lo grabó.' },
        { q: '¿Hay límite de vídeos o estudiantes?', a: 'Depende del plan. El plan gratuito incluye funcionalidades básicas. Los planes de pago ofrecen almacenamiento ilimitado y sin límite de estudiantes.' },
        { q: '¿Cómo funcionan las clases en directo?', a: 'Se integra con Zoom. Puedes programar y lanzar clases en directo desde el panel. Las sesiones se graban automáticamente y quedan protegidas.' },
        { q: '¿Puedo migrar desde otra plataforma?', a: 'Sí. Nuestro equipo te ayuda con la migración de contenido y estudiantes. Escríbenos para un plan personalizado.' },
        { q: '¿Es seguro el pago?', a: 'Los pagos se procesan a través de Stripe, el procesador de pagos más seguro del mundo, usado por Amazon, Google y miles de empresas.' },
      ],
      contact: { title: '¿Aún tienes preguntas?', subtitle: 'Nuestro equipo está listo para ayudarte.', cta: 'Contactar Soporte' },
    },
    cta: {
      title1: '¿Listo para transformar',
      titleHighlight: 'tu academia',
      title2: '?',
      subtitle: 'Únete a las academias que ya protegen su contenido y gestionan todo desde AKADEMO.',
      button: 'Empieza Gratis',
      tags: ['Optimización con IA', 'Protección total', 'Sin tarjeta de crédito', 'Gratis para empezar', 'Cancela cuando quieras'],
    },
    footer: {
      tagline: 'Plataforma de protección y gestión para academias online que quieren proteger su contenido y crecer.',
      rights: '© 2025 AKADEMO. Todos los derechos reservados.',
      product: 'Producto', resources: 'Recursos', company: 'Compañía', legal: 'Legal',
      featuresLink: 'Características', pricingLink: 'Precios',
      contactLink: 'Contacto', privacyLink: 'Privacidad', termsLink: 'Términos',
    },
  },
  en: {
    nav: { features: 'Features', pricing: 'Pricing', login: 'Login', cta: 'Start Free' },
    hero: {
      badge: 'Exclusive Platform for Academies',
      title1: 'Stop losing money.',
      title2: 'Protect your academy with technology.',
      subtitle: 'The infrastructure your academy needs to protect content, prevent account sharing, and manage everything from one place.',
      cta: 'Start Free',
      cta2: 'See Pricing',
      tags: ['No credit card required', 'Free to start', 'Cancel anytime'],
    },
    problem: {
      label: 'THE PROBLEM',
      title1: 'Online education is',
      titleHighlight: 'broken',
      title2: 'for academies',
      subtitle: 'While big platforms have entire security teams, you\'re fighting content piracy alone.',
      stats: [
        { value: '€5,000+', label: 'Lost per year', desc: 'from shared accounts among students who don\'t pay.' },
        { value: '40+', label: 'Hours per month', desc: 'managing students, payments and content in spreadsheets.' },
        { value: '73%', label: 'Of academies', desc: 'don\'t know who shares their videos or how to stop it.' },
      ],
      painPoints: [
        'Content downloaded and resold',
        'Rising acquisition costs',
        'Competitors using your own material',
      ],
      solution: 'What if there was a better way?',
    },
    features: {
      label: 'FEATURES',
      title1: 'Everything you need in',
      titleHighlight: 'one place',
      subtitle: 'A unified command center for your entire academy. No more switching between platforms.',
      list: [
        { icon: '🛡️', title: 'Anti-Sharing', desc: 'One active session per student. Automatic blocking of shared accounts.' },
        { icon: '🎬', title: 'Secure Streaming', desc: 'Protected videos with no download button. Encrypted transmission.' },
        { icon: '👁️', title: 'Watermark', desc: 'Student name and email visible on every video.' },
        { icon: '📊', title: 'Dashboard', desc: 'Real-time metrics for attendance, progress and payments.' },
        { icon: '🎥', title: 'Live Classes', desc: 'Zoom integration with automatic protected recording.' },
        { icon: '📝', title: 'Assignments', desc: 'Create, receive and grade assignments all integrated.' },
        { icon: '💳', title: 'Payment Management', desc: 'Track who paid. Auto-block delinquent accounts.' },
        { icon: '👥', title: 'Roles & Permissions', desc: 'Academy, teachers and students with defined access.' },
        { icon: '📱', title: 'Mobile-First', desc: 'Works perfectly on mobile, tablet and desktop.' },
      ],
    },
    comparison: {
      label: 'THE DIFFERENCE',
      title1: 'Academies',
      titleBefore: 'Before',
      titleVs: 'vs',
      titleAfter: 'After',
      title2: 'AKADEMO',
      subtitle: 'Stop settling for outdated methods. See why academies are switching.',
      headers: ['Feature', 'Without AKADEMO', 'With AKADEMO'],
      rows: [
        ['Account sharing', 'No control, losing money', 'Automatically blocked'],
        ['Content protection', 'Downloads and leaks', 'Secure streaming + watermark'],
        ['Student management', 'Excel and manual emails', 'Centralized dashboard'],
        ['Payment control', 'Chasing one by one', 'Automatic access by payment'],
        ['Ratings', 'No feedback', 'Per-lesson and topic system'],
        ['Live classes', 'Unprotected Zoom', 'Integrated with protected recording'],
      ],
      cta: 'Start transforming your academy',
    },
    product: {
      label: 'THE SOLUTION',
      title1: 'Meet your',
      titleHighlight: 'complete platform',
      subtitle: 'Everything you need to protect and manage your academy. No tech expertise required.',
      items: [
        { badge: 'Protection', icon: '🛡️', title: 'Anti-Sharing Protection', desc: 'Your 24/7 security guard. Automatic multi-session blocking and suspicious pattern detection.', features: ['One active session per student', 'Suspicious pattern detection', 'Real-time alerts', 'Access history', 'Automatic blocking'] },
        { badge: 'Content', icon: '🎬', title: 'Protected Streaming', desc: 'Your videos streamed with encryption. No downloads. With personalized watermark.', features: ['No download button', 'Dynamic watermark', 'Encrypted streaming', 'Playback control', 'Anti-recording protection'] },
        { badge: 'Management', icon: '📊', title: 'Complete Dashboard', desc: 'Everything at a glance: students, classes, payments, attendance, ratings.', features: ['Real-time metrics', 'Progress tracking', 'Payment management', 'Downloadable reports', 'Per-class or global view'] },
        { badge: 'Live', icon: '🎥', title: 'Live Classes', desc: 'Broadcast live with integrated Zoom. Automatic protected recording.', features: ['Native Zoom integration', 'Automatic recording', 'Recording protection', 'Attendance stats', 'Multi-academy'] },
        { badge: 'Assessment', icon: '📝', title: 'Assignments & Grading', desc: 'Assign, receive and grade work. All integrated without leaving the platform.', features: ['Task creation', 'Work submission', 'Grading system', 'Deadlines', 'Automatic notifications'] },
        { badge: 'Roles', icon: '👥', title: 'Roles & Permissions', desc: 'Academy, Teachers, Students. Each sees exactly what they need.', features: ['Teacher management', 'Controlled enrollments', 'Granular permissions', 'Role-based views', 'Teacher collaboration'] },
      ],
    },
    faq: {
      title: 'Frequently Asked Questions',
      subtitle: 'Everything you need to know about AKADEMO. Can\'t find what you\'re looking for? Contact us.',
      items: [
        { q: 'How does anti-sharing protection work?', a: 'Each student can only have one active session. If someone logs in from another device, the previous session closes automatically. We also monitor suspicious access patterns.' },
        { q: 'What if a student records the screen?', a: 'Every video shows a dynamic watermark with the student\'s name and email. If a leaked video appears, you can identify exactly who recorded it.' },
        { q: 'Is there a limit on videos or students?', a: 'Depends on the plan. The free plan includes basic features. Paid plans offer unlimited storage and no student limits.' },
        { q: 'How do live classes work?', a: 'It integrates with Zoom. You can schedule and launch live classes from the panel. Sessions are automatically recorded and protected.' },
        { q: 'Can I migrate from another platform?', a: 'Yes. Our team helps you with content and student migration. Contact us for a personalized plan.' },
        { q: 'Is payment secure?', a: 'Payments are processed through Stripe, the world\'s most secure payment processor, used by Amazon, Google and thousands of companies.' },
      ],
      contact: { title: 'Still have questions?', subtitle: 'Our team is ready to help.', cta: 'Contact Support' },
    },
    cta: {
      title1: 'Ready to transform',
      titleHighlight: 'your academy',
      title2: '?',
      subtitle: 'Join the academies already protecting their content and managing everything from AKADEMO.',
      button: 'Start Free',
      tags: ['AI optimization', 'Total protection', 'No credit card', 'Free to start', 'Cancel anytime'],
    },
    footer: {
      tagline: 'Protection and management platform for online academies that want to protect their content and grow.',
      rights: '© 2025 AKADEMO. All rights reserved.',
      product: 'Product', resources: 'Resources', company: 'Company', legal: 'Legal',
      featuresLink: 'Features', pricingLink: 'Pricing',
      contactLink: 'Contact', privacyLink: 'Privacy', termsLink: 'Terms',
    },
  },
};

export default function FeaturesPage() {
  const [lang, setLang] = useState<Lang>('es');
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
            <Link href="/features" className="text-sm font-medium text-white">{tr.nav.features}</Link>
            <Link href="/pricing" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">{tr.nav.pricing}</Link>
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

      {/* ─── HERO ─── */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            {tr.hero.badge}
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            {tr.hero.title1}
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{tr.hero.title2}</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            {tr.hero.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Link href="/?modal=register" className="px-8 py-3.5 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-all text-sm sm:text-base text-center">
              {tr.hero.cta}
            </Link>
            <Link href="/pricing" className="px-8 py-3.5 bg-white/5 border border-white/10 text-white font-medium rounded-lg hover:bg-white/10 transition-all text-sm sm:text-base text-center">
              {tr.hero.cta2}
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {tr.hero.tags.map((tag, i) => (
              <span key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROBLEM SECTION ─── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-950/5 to-transparent" />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-xs font-semibold tracking-wider uppercase mb-6">{tr.problem.label}</span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
              {tr.problem.title1} <span className="text-red-400">{tr.problem.titleHighlight}</span> {tr.problem.title2}
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">{tr.problem.subtitle}</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            {tr.problem.stats.map((stat, i) => (
              <div key={i} className="relative p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-red-500/20 transition-all group">
                <div className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
                </div>
                <div className="text-4xl sm:text-5xl font-bold text-red-400 mb-2">{stat.value}</div>
                <div className="text-sm font-semibold text-white uppercase tracking-wide mb-3">{stat.label}</div>
                <p className="text-gray-500 text-sm leading-relaxed">{stat.desc}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            {tr.problem.painPoints.map((point, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 bg-red-500/5 border border-red-500/10 rounded-full">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                <span className="text-sm text-gray-400">{point}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-lg font-medium text-emerald-400">{tr.problem.solution}</p>
        </div>
      </section>

      {/* ─── FEATURES GRID ─── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/5 to-transparent" />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold tracking-wider uppercase mb-6">{tr.features.label}</span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
              {tr.features.title1} <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{tr.features.titleHighlight}</span>
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">{tr.features.subtitle}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tr.features.list.map((f, i) => (
              <div key={i} className="group p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/20 hover:bg-white/[0.04] transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">{f.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BEFORE vs AFTER ─── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full text-gray-400 text-xs font-semibold tracking-wider uppercase mb-6">{tr.comparison.label}</span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
              {tr.comparison.title1} <span className="text-red-400">{tr.comparison.titleBefore}</span> {tr.comparison.titleVs} <span className="text-emerald-400">{tr.comparison.titleAfter}</span> {tr.comparison.title2}
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">{tr.comparison.subtitle}</p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/[0.03]">
                  {tr.comparison.headers.map((h, i) => (
                    <th key={i} className={`py-4 px-5 text-left font-semibold text-xs uppercase tracking-wider ${i === 0 ? 'text-gray-300' : i === 1 ? 'text-red-400' : 'text-emerald-400'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tr.comparison.rows.map((row, i) => (
                  <tr key={i} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-5 font-medium text-gray-200">{row[0]}</td>
                    <td className="py-4 px-5 text-red-400/80">
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        {row[1]}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-emerald-400/80">
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {row[2]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-center mt-10">
            <Link href="/?modal=register" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-black font-medium rounded-lg hover:bg-emerald-400 transition-all text-sm">
              {tr.comparison.cta}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── PRODUCT FEATURES ─── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/5 to-transparent" />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold tracking-wider uppercase mb-6">{tr.product.label}</span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
              {tr.product.title1} <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{tr.product.titleHighlight}</span>
            </h2>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">{tr.product.subtitle}</p>
          </div>
          <div className="space-y-6">
            {/* Hero card */}
            {tr.product.items.slice(0, 1).map((item, i) => (
              <div key={i} className="grid md:grid-cols-2 gap-8 p-8 sm:p-10 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/20 transition-all">
                <div>
                  <span className="inline-block px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-md mb-4">{item.badge}</span>
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">{item.desc}</p>
                  <ul className="space-y-2.5">
                    {item.features.map((f, fi) => (
                      <li key={fi} className="flex items-center gap-2.5 text-sm text-gray-300">
                        <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-full max-w-sm aspect-square rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-white/[0.06] flex items-center justify-center">
                    <span className="text-8xl opacity-30">{item.icon}</span>
                  </div>
                </div>
              </div>
            ))}
            {/* Grid of remaining cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tr.product.items.slice(1).map((item, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/20 transition-all group">
                  <span className="inline-block px-2 py-0.5 bg-white/5 text-gray-400 text-[10px] font-medium rounded-md mb-3 uppercase tracking-wider">{item.badge}</span>
                  <div className="text-2xl mb-3">{item.icon}</div>
                  <h3 className="text-base font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed mb-4">{item.desc}</p>
                  <ul className="space-y-1.5">
                    {item.features.slice(0, 3).map((f, fi) => (
                      <li key={fi} className="flex items-center gap-2 text-xs text-gray-400">
                        <svg className="w-3 h-3 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">{tr.faq.title}</h2>
            <p className="text-gray-400 text-sm sm:text-base">{tr.faq.subtitle}</p>
          </div>
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
          <div className="mt-10 text-center p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <h3 className="font-semibold text-gray-200 mb-1">{tr.faq.contact.title}</h3>
            <p className="text-gray-500 text-sm mb-4">{tr.faq.contact.subtitle}</p>
            <a href="mailto:info@akademo.es" className="inline-block px-5 py-2.5 bg-white/5 border border-white/10 text-white text-sm font-medium rounded-lg hover:bg-white/10 transition-all">
              {tr.faq.contact.cta}
            </a>
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
          <Link href="/?modal=register" className="inline-block px-8 py-3.5 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-all text-sm sm:text-base mb-8">
            {tr.cta.button}
          </Link>
          <div className="flex flex-wrap justify-center gap-3">
            {tr.cta.tags.map((tag, i) => (
              <span key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                {tag}
              </span>
            ))}
          </div>
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
