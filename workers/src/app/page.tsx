'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import AuthModal from '@/components/AuthModal';

// Translations
const translations = {
  es: {
    // Nav
    login: 'Iniciar Sesión',
    getStarted: 'Comenzar',
    
    // Hero
    heroBadge: 'Plataforma Exclusiva para Academias',
    heroTitle1: 'Tu Academia.',
    heroTitle2: 'Totalmente Protegida.',
    heroSubtitle: 'La infraestructura que tu academia necesita para proteger su contenido, prevenir cuentas compartidas y gestionar todo desde un solo lugar.',
    startFree: 'Comenzar Gratis',
    signIn: 'Ya tengo cuenta',
    
    // Why Section
    whyTitle: '¿Por qué las academias eligen esta plataforma?',
    whySubtitle: 'Porque entiende los problemas reales que enfrentan cada día.',
    whyProblem1Title: 'Cuentas compartidas',
    whyProblem1Desc: 'Estudiantes que pagan una vez y comparten acceso con amigos, familiares o grupos enteros.',
    whyProblem2Title: 'Contenido filtrado',
    whyProblem2Desc: 'Videos descargados y compartidos en grupos de Telegram, WhatsApp o revendidos ilegalmente.',
    whyProblem3Title: 'Gestión caótica',
    whyProblem3Desc: 'Profesores, estudiantes y clases dispersos en hojas de cálculo, emails y múltiples plataformas.',
    whyProblem4Title: 'Sin visibilidad',
    whyProblem4Desc: 'No saber quién accede a qué, cuándo, ni cómo se consume el contenido.',
    whySolution: 'Esta plataforma es la infraestructura que no sabías que necesitaba... hasta ahora.',
    
    // Account Sharing Section
    sharingTitle: 'Tolerancia Cero con Cuentas Compartidas',
    sharingSubtitle: 'Tú enseñas. Nosotros vigilamos las puertas.',
    sharingFeature1: 'Una sesión activa por estudiante',
    sharingFeature1Desc: 'Si alguien inicia sesión desde otro dispositivo, la sesión anterior se cierra automáticamente.',
    sharingFeature2: 'Detección de patrones sospechosos',
    sharingFeature2Desc: 'Monitoreo automático de comportamientos anómalos sin trabajo extra para ti.',
    sharingFeature3: 'Alertas en tiempo real',
    sharingFeature3Desc: 'Recibe notificaciones cuando se detecta actividad inusual en las cuentas.',
    
    // Content Protection Section
    contentTitle: 'Tu Contenido, Blindado',
    contentSubtitle: 'Videos, documentos e imágenes con protección de nivel empresarial.',
    contentFeature1: 'Sin descargas',
    contentFeature1Desc: 'El contenido se transmite de forma segura. No hay botón de descarga.',
    contentFeature2: 'Límites de reproducción',
    contentFeature2Desc: 'Controla cuántas veces o cuánto tiempo puede verse cada video.',
    contentFeature3: 'Acceso controlado',
    contentFeature3Desc: 'Solo los estudiantes inscritos pueden acceder al contenido de cada clase.',
    
    // Watermark Section
    watermarkTitle: 'Si alguien filtra tu contenido, sabrás quién fue',
    watermarkSubtitle: 'Cada video muestra una marca de agua dinámica con el nombre y email del estudiante.',
    watermarkFeature1: 'Marca de agua visible',
    watermarkFeature1Desc: 'Siempre presente durante la reproducción, disuade la grabación de pantalla.',
    watermarkFeature2: 'Trazabilidad total',
    watermarkFeature2Desc: 'Si aparece un video filtrado, puedes rastrear exactamente quién lo grabó.',
    watermarkFeature3: 'Protección legal',
    watermarkFeature3Desc: 'Combinado con un acuerdo de uso, tienes evidencia clara para actuar.',
    watermarkQuote: '"Si alguien comparte tu contenido, es obvio quién lo hizo."',
    
    // Management Section
    managementTitle: 'Organización Académica Simplificada',
    managementSubtitle: 'No es solo una plataforma de videos. Es el sistema operativo de tu academia.',
    managementFeature1: 'Gestión de profesores',
    managementFeature1Desc: 'Cada profesor gestiona sus propias academias y clases de forma independiente.',
    managementFeature2: 'Gestión de estudiantes',
    managementFeature2Desc: 'Inscripciones, accesos y seguimiento de progreso en un solo lugar.',
    managementFeature3: 'Clases organizadas',
    managementFeature3Desc: 'Agrupa contenido por cursos, módulos o cohortes según tu estructura.',
    managementFeature4: 'Roles y permisos',
    managementFeature4Desc: 'Administradores, profesores y estudiantes con accesos claramente definidos.',
    
    // CTA Section
    ctaTitle: '¿Listo para proteger tu academia?',
    ctaSubtitle: 'Empieza gratis. Sin tarjeta de crédito. Sin compromisos.',
    ctaButton: 'Crear Mi Academia',
    
    // Contact Section
    contactTitle: 'Hablemos',
    contactSubtitle: 'Si diriges una academia y te importa tu contenido, deberíamos conversar.',
    contactText: 'No somos un chatbot. Somos personas reales que entienden tu negocio y quieren ayudarte a protegerlo.',
    contactEmail: 'Escríbenos a',
    contactDemo: 'Solicitar Demo',
    
    // Footer
    footerRights: '© 2025 AKADEMO. Todos los derechos reservados.',
    footerTagline: 'Protegiendo el conocimiento que creas.',
  },
  en: {
    // Nav
    login: 'Login',
    getStarted: 'Get Started',
    
    // Hero
    heroBadge: 'Exclusive Platform for Academies',
    heroTitle1: 'Your Academy.',
    heroTitle2: 'Fully Protected.',
    heroSubtitle: 'The infrastructure your academy needs to protect content, prevent account sharing, and manage everything from one place.',
    startFree: 'Start Free',
    signIn: 'Sign In',
    
    // Why Section
    whyTitle: 'Why academies choose this platform?',
    whySubtitle: 'Because it understands the real problems they face every day.',
    whyProblem1Title: 'Account sharing',
    whyProblem1Desc: 'Students who pay once and share access with friends, family, or entire groups.',
    whyProblem2Title: 'Leaked content',
    whyProblem2Desc: 'Downloaded videos shared on Telegram, WhatsApp groups, or illegally resold.',
    whyProblem3Title: 'Chaotic management',
    whyProblem3Desc: 'Teachers, students, and classes scattered across spreadsheets, emails, and multiple platforms.',
    whyProblem4Title: 'No visibility',
    whyProblem4Desc: 'Not knowing who accesses what, when, or how content is being consumed.',
    whySolution: 'This platform is the infrastructure you didn\'t know you needed—until now.',
    
    // Account Sharing Section
    sharingTitle: 'Zero Tolerance for Account Sharing',
    sharingSubtitle: 'You teach. We watch the doors.',
    sharingFeature1: 'One active session per student',
    sharingFeature1Desc: 'If someone logs in from another device, the previous session is automatically closed.',
    sharingFeature2: 'Suspicious pattern detection',
    sharingFeature2Desc: 'Automatic monitoring of anomalous behaviors without extra work for you.',
    sharingFeature3: 'Real-time alerts',
    sharingFeature3Desc: 'Get notified when unusual activity is detected on accounts.',
    
    // Content Protection Section
    contentTitle: 'Your Content, Armored',
    contentSubtitle: 'Videos, documents, and images with enterprise-level protection.',
    contentFeature1: 'No downloads',
    contentFeature1Desc: 'Content is streamed securely. There\'s no download button.',
    contentFeature2: 'Playback limits',
    contentFeature2Desc: 'Control how many times or how long each video can be watched.',
    contentFeature3: 'Controlled access',
    contentFeature3Desc: 'Only enrolled students can access each class\'s content.',
    
    // Watermark Section
    watermarkTitle: 'If someone leaks your content, you\'ll know who',
    watermarkSubtitle: 'Every video displays a dynamic watermark with the student\'s name and email.',
    watermarkFeature1: 'Visible watermark',
    watermarkFeature1Desc: 'Always present during playback, discourages screen recording.',
    watermarkFeature2: 'Full traceability',
    watermarkFeature2Desc: 'If a leaked video appears, you can trace exactly who recorded it.',
    watermarkFeature3: 'Legal protection',
    watermarkFeature3Desc: 'Combined with a usage agreement, you have clear evidence to act.',
    watermarkQuote: '"If someone shares your content, it\'s obvious who did it."',
    
    // Management Section
    managementTitle: 'Academic Organization Simplified',
    managementSubtitle: 'It\'s not just a video platform. It\'s your academy\'s operating system.',
    managementFeature1: 'Teacher management',
    managementFeature1Desc: 'Each teacher manages their own academies and classes independently.',
    managementFeature2: 'Student management',
    managementFeature2Desc: 'Enrollments, access, and progress tracking in one place.',
    managementFeature3: 'Organized classes',
    managementFeature3Desc: 'Group content by courses, modules, or cohorts according to your structure.',
    managementFeature4: 'Roles and permissions',
    managementFeature4Desc: 'Admins, teachers, and students with clearly defined access levels.',
    
    // CTA Section
    ctaTitle: 'Ready to protect your academy?',
    ctaSubtitle: 'Start free. No credit card. No commitments.',
    ctaButton: 'Create My Academy',
    
    // Contact Section
    contactTitle: 'Let\'s Talk',
    contactSubtitle: 'If you run an academy and care about your content, we should talk.',
    contactText: 'We\'re not a chatbot. We\'re real people who understand your business and want to help you protect it.',
    contactEmail: 'Email us at',
    contactDemo: 'Request Demo',
    
    // Footer
    footerRights: '© 2025 AKADEMO. All rights reserved.',
    footerTagline: 'Protecting the knowledge you create.',
  }
};

type Language = 'es' | 'en';

function HomePageContent() {
  const searchParams = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'login' | 'register'>('login');
  const [lang, setLang] = useState<Language>('es');
  const [isScrolled, setIsScrolled] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    const handleScroll = () => {
      // Check if navbar is about to cross the hero section (bottom of hero)
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

      {/* Glass Header with Scroll Detection */}
      <header className="fixed top-0 left-0 right-0 z-40 transition-all">
        <div className="mx-3 sm:mx-6 mt-3 sm:mt-4">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg bg-white/10 border border-white/20">
            <div className="flex justify-between items-center relative">
              {/* Logo - Left */}
              <div className="flex items-center gap-2">
                <img 
                  src="/logo/AKADEMO_logo_OTHER2.svg"
                  alt="AKADEMO" 
                  className="h-7 sm:h-9 w-auto transition-all"
                />
                <span className={`text-lg sm:text-xl font-bold transition-colors font-[family-name:var(--font-montserrat)] ${
                  isScrolled ? 'text-gray-900' : 'text-white'
                }`}>AKADEMO</span>
              </div>
              
              {/* Right Actions - Fixed width */}
              <div className="flex items-center gap-1.5 sm:gap-3 justify-end">
                <button
                  onClick={() => openModal('login')}
                  className={`px-2.5 sm:px-4 py-1.5 sm:py-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    isScrolled ? 'text-gray-600 hover:text-gray-900' : 'text-white/90 hover:text-white'
                  }`}
                >
                  {t.login}
                </button>
                <button
                  onClick={() => openModal('register')}
                  className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-all shadow-sm whitespace-nowrap ${
                    isScrolled 
                      ? 'bg-gray-900 text-white hover:bg-gray-800' 
                      : 'bg-white text-gray-900 hover:bg-white/90'
                  }`}
                >
                  {t.getStarted}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Language Switcher - Below navbar on mobile, top right on desktop */}
        <div className="fixed top-20 sm:top-6 right-4 sm:right-6 z-50 flex gap-1.5">
          <button
            onClick={() => setLang('es')}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all overflow-hidden shadow-lg ${
              lang === 'es' 
                ? 'bg-white scale-110' 
                : 'bg-white/70 hover:bg-white/90 backdrop-blur'
            }`}
            title="Español"
          >
            <img 
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 600'%3E%3Cpath fill='%23c60b1e' d='M0 0h900v600H0z'/%3E%3Cpath fill='%23ffc400' d='M0 150h900v300H0z'/%3E%3C/svg%3E" 
              alt="ES" 
              className="w-5 h-5 sm:w-6 sm:h-6"
            />
          </button>
          <button
            onClick={() => setLang('en')}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all overflow-hidden shadow-lg ${
              lang === 'en' 
                ? 'bg-white scale-110' 
                : 'bg-white/70 hover:bg-white/90 backdrop-blur'
            }`}
            title="English"
          >
            <img 
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 30'%3E%3Cpath fill='%23012169' d='M0 0h60v30H0z'/%3E%3Cpath stroke='%23fff' stroke-width='6' d='M0 0l60 30m0-30L0 30'/%3E%3Cpath stroke='%23C8102E' stroke-width='4' d='M0 0l60 30m0-30L0 30'/%3E%3Cpath stroke='%23fff' stroke-width='10' d='M30 0v30M0 15h60'/%3E%3Cpath stroke='%23C8102E' stroke-width='6' d='M30 0v30M0 15h60'/%3E%3C/svg%3E" 
              alt="EN" 
              className="w-5 h-5 sm:w-6 sm:h-6"
            />
          </button>
        </div>
      </header>

      {/* Hero with Background */}
      <section 
        className="relative min-h-screen flex items-center justify-center px-4 sm:px-6"
        style={{
          backgroundImage: 'url(/hero-bg_mobile.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Desktop background overlay */}
        <style jsx>{`
          @media (min-width: 768px) {
            section {
              background-image: url(/hero-bg.webp) !important;
            }
          }
        `}</style>
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
        
        <div className="relative max-w-4xl mx-auto text-center pt-24 sm:pt-20 px-2">
          <p className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-md rounded-full text-white/90 text-xs sm:text-sm font-medium mb-6 sm:mb-8 border border-white/20">
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            {t.heroBadge}
          </p>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-[1.15] sm:leading-tight tracking-tight px-2">
            {t.heroTitle1}
            <br />
            <span className="italic font-light">{t.heroTitle2}</span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-white/90 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-2">
            {t.heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center px-4">
            <button
              onClick={() => openModal('register')}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-white text-gray-900 rounded-xl hover:bg-white/90 font-medium text-sm sm:text-base transition-all shadow-lg"
            >
              {t.startFree}
            </button>
            <button
              onClick={() => openModal('login')}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-white/10 backdrop-blur text-white border border-white/30 rounded-xl hover:bg-white/20 font-medium text-sm sm:text-base transition-all"
            >
              {t.signIn}
            </button>
          </div>
        </div>
        
        {/* Scroll indicator - hidden on mobile */}
        <div className="hidden sm:block absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Why Section */}
      <section className="py-12 sm:py-20 lg:py-32 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight px-2">
              {t.whyTitle}
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-2">
              {t.whySubtitle}
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-12 sm:mb-16">
            <div className="group border border-gray-200 rounded-xl p-6 sm:p-8 hover:border-gray-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-gray-200 transition-colors">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{t.whyProblem1Title}</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{t.whyProblem1Desc}</p>
            </div>

            <div className="group border border-gray-200 rounded-xl p-6 sm:p-8 hover:border-gray-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-gray-200 transition-colors">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{t.whyProblem2Title}</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{t.whyProblem2Desc}</p>
            </div>

            <div className="group border border-gray-200 rounded-xl p-6 sm:p-8 hover:border-gray-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-gray-200 transition-colors">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{t.whyProblem3Title}</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{t.whyProblem3Desc}</p>
            </div>

            <div className="group border border-gray-200 rounded-xl p-6 sm:p-8 hover:border-gray-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-gray-200 transition-colors">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{t.whyProblem4Title}</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{t.whyProblem4Desc}</p>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-2xl p-6 sm:p-8 lg:p-12 text-center">
            <p className="text-lg sm:text-xl lg:text-2xl font-medium text-white leading-relaxed">
              {t.whySolution}
            </p>
          </div>
        </div>
      </section>

      {/* Account Sharing Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 backdrop-blur rounded-full text-blue-300 text-sm font-medium mb-6 border border-blue-500/30">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Protección Activa
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold mb-6 leading-tight">
              {t.sharingTitle}
            </h2>
            <p className="text-2xl text-gray-300 italic font-light">
              &ldquo;{t.sharingSubtitle}&rdquo;
            </p>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="group h-full">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/10 hover:border-blue-500/50 transition-all hover:shadow-2xl hover:shadow-blue-500/20 h-full flex flex-col">
                <div className="flex items-start justify-between mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <SingleSessionIcon />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-400">99.9%</div>
                    <div className="text-[10px] sm:text-xs text-gray-400 mt-1">Tasa de detección</div>
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">{t.sharingFeature1}</h3>
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed flex-1">{t.sharingFeature1Desc}</p>
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/10">
                  <div className="flex items-center gap-2 text-blue-400 text-xs sm:text-sm font-medium">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    Activo en tiempo real
                  </div>
                </div>
              </div>
            </div>

            <div className="group h-full">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/10 hover:border-purple-500/50 transition-all hover:shadow-2xl hover:shadow-purple-500/20 h-full flex flex-col">
                <div className="flex items-start justify-between mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <DetectionIcon />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-bold text-purple-400">&lt;1s</div>
                    <div className="text-[10px] sm:text-xs text-gray-400 mt-1">Tiempo de respuesta</div>
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">{t.sharingFeature2}</h3>
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed flex-1">{t.sharingFeature2Desc}</p>
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/10">
                  <div className="flex items-center gap-2 text-purple-400 text-xs sm:text-sm font-medium">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                    IA de monitoreo
                  </div>
                </div>
              </div>
            </div>

            <div className="group h-full">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/10 hover:border-pink-500/50 transition-all hover:shadow-2xl hover:shadow-pink-500/20 h-full flex flex-col">
                <div className="flex items-start justify-between mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <AlertIcon />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-bold text-pink-400">24/7</div>
                    <div className="text-[10px] sm:text-xs text-gray-400 mt-1">Monitoreo activo</div>
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">{t.sharingFeature3}</h3>
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed flex-1">{t.sharingFeature3Desc}</p>
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/10">
                  <div className="flex items-center gap-2 text-pink-400 text-xs sm:text-sm font-medium">
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" />
                    Notificaciones instant
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Protection Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 bg-white relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-600 text-sm font-medium mb-6">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Seguridad de Contenido
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {t.contentTitle}
              </h2>
              <p className="text-xl text-gray-600 mb-10">
                {t.contentSubtitle}
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <NoDownloadIcon />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">{t.contentFeature1}</h3>
                    <p className="text-gray-600">{t.contentFeature1Desc}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <TimerIcon />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">{t.contentFeature2}</h3>
                    <p className="text-gray-600">{t.contentFeature2Desc}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                    <LockIcon />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">{t.contentFeature3}</h3>
                    <p className="text-gray-600">{t.contentFeature3Desc}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Visual */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-purple-200 rounded-3xl blur-3xl opacity-30" />
              <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 shadow-2xl border border-gray-200">
                <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-20 h-20 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  {/* Watermark preview */}
                  <div className="absolute top-4 left-4 text-white/40 text-xs font-mono">
                    student@academy.com
                  </div>
                  <div className="absolute bottom-4 right-4 text-white/40 text-xs font-mono">
                    ID: #12345
                  </div>
                  {/* Lock overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end justify-center pb-6">
                    <div className="flex items-center gap-2 text-white text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="font-medium">Contenido Protegido</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    Streaming seguro
                  </span>
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Encriptado
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Watermark Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 bg-gradient-to-b from-gray-900 via-blue-900 to-gray-900 text-white relative overflow-hidden">
        {/* Animated grid background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ 
            backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-5xl font-bold mb-6 leading-tight">
              {t.watermarkTitle}
            </h2>
            <p className="text-xl text-blue-200 max-w-3xl mx-auto">
              {t.watermarkSubtitle}
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            {/* Visual demo */}
            <div className="order-2 lg:order-1">
              <div className="relative bg-black/50 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative">
                  {/* Simulated video player */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        </svg>
                      </div>
                      <p className="text-white/60 text-sm">Video de Clase</p>
                    </div>
                  </div>
                  
                  {/* Dynamic watermarks */}
                  <div className="absolute top-6 left-6 bg-black/40 backdrop-blur px-3 py-1.5 rounded text-white/70 text-sm font-mono border border-white/10">
                    Juan Pérez
                  </div>
                  <div className="absolute top-6 right-6 bg-black/40 backdrop-blur px-3 py-1.5 rounded text-white/70 text-sm font-mono border border-white/10">
                    juan.perez@email.com
                  </div>
                  <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur px-3 py-1.5 rounded text-white/70 text-xs font-mono border border-white/10">
                    ID: #STU-45892
                  </div>
                  <div className="absolute bottom-6 right-6 bg-black/40 backdrop-blur px-3 py-1.5 rounded text-white/70 text-xs font-mono border border-white/10">
                    {new Date().toLocaleTimeString()}
                  </div>
                  
                  {/* Center subtle watermark */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white/10 text-6xl font-bold transform -rotate-12">
                      JUAN PÉREZ
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-black/30 backdrop-blur border-t border-white/5 flex items-center justify-between">
                  <span className="text-white/60 text-sm">Siempre visible • No removible</span>
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Activo
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="order-1 lg:order-2 space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                  <WatermarkIcon />
                </div>
                <div>
                  <h3 className="font-bold text-white text-xl mb-2">{t.watermarkFeature1}</h3>
                  <p className="text-blue-200">{t.watermarkFeature1Desc}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/30">
                  <TraceIcon />
                </div>
                <div>
                  <h3 className="font-bold text-white text-xl mb-2">{t.watermarkFeature2}</h3>
                  <p className="text-blue-200">{t.watermarkFeature2Desc}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center border border-green-500/30">
                  <ShieldIcon />
                </div>
                <div>
                  <h3 className="font-bold text-white text-xl mb-2">{t.watermarkFeature3}</h3>
                  <p className="text-blue-200">{t.watermarkFeature3Desc}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 rounded-2xl blur-2xl opacity-20" />
            <div className="relative bg-blue-500/10 backdrop-blur-xl rounded-2xl p-8 sm:p-12 text-center border border-blue-500/30">
              <p className="text-2xl sm:text-3xl font-bold text-blue-100 leading-relaxed">
                {t.watermarkQuote}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Management Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 bg-gradient-to-b from-white via-blue-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-600 text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Sistema de Gestión
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {t.managementTitle}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t.managementSubtitle}
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="group relative">
              <div className="relative bg-white rounded-2xl p-8 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
                    <TeacherIcon />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-xl mb-2">{t.managementFeature1}</h3>
                    <p className="text-gray-600">{t.managementFeature1Desc}</p>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Autonomía total</span>
                    <span className="text-blue-600 font-semibold">✓</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Control individual</span>
                    <span className="text-blue-600 font-semibold">✓</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative">
              <div className="relative bg-white rounded-2xl p-8 border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
                    <StudentIcon />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-xl mb-2">{t.managementFeature2}</h3>
                    <p className="text-gray-600">{t.managementFeature2Desc}</p>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Inscripciones simples</span>
                    <span className="text-purple-600 font-semibold">✓</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Seguimiento completo</span>
                    <span className="text-purple-600 font-semibold">✓</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative">
              <div className="relative bg-white rounded-2xl p-8 border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
                    <ClassIcon />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-xl mb-2">{t.managementFeature3}</h3>
                    <p className="text-gray-600">{t.managementFeature3Desc}</p>
                  </div>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Estructura flexible</span>
                    <span className="text-green-600 font-semibold">✓</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Fácil organización</span>
                    <span className="text-green-600 font-semibold">✓</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative">
              <div className="relative bg-white rounded-2xl p-8 border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
                    <RolesIcon />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-xl mb-2">{t.managementFeature4}</h3>
                    <p className="text-gray-600">{t.managementFeature4Desc}</p>
                  </div>
                </div>
                <div className="bg-orange-50 rounded-xl p-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Permisos claros</span>
                    <span className="text-orange-600 font-semibold">✓</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Accesos definidos</span>
                    <span className="text-orange-600 font-semibold">✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 bg-blue-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {t.ctaTitle}
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            {t.ctaSubtitle}
          </p>
          <button
            onClick={() => openModal('register')}
            className="px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-blue-50 font-semibold text-lg transition-all shadow-lg"
          >
            {t.ctaButton}
          </button>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t.contactTitle}
            </h2>
            <p className="text-lg text-gray-600">
              {t.contactSubtitle}
            </p>
          </div>
          
          <form className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                {lang === 'es' ? 'Nombre' : 'Name'}
              </label>
              <input
                type="text"
                id="name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder={lang === 'es' ? 'Tu nombre' : 'Your name'}
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {lang === 'es' ? 'Email' : 'Email'}
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder={lang === 'es' ? 'tu@email.com' : 'your@email.com'}
              />
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                {lang === 'es' ? 'Mensaje' : 'Message'}
              </label>
              <textarea
                id="message"
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder={lang === 'es' ? 'Cuéntanos sobre tu academia...' : 'Tell us about your academy...'}
              />
            </div>
            
            <button
              type="submit"
              className="w-full px-8 py-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-colors"
            >
              {lang === 'es' ? 'Enviar Mensaje' : 'Send Message'}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-3">
              {lang === 'es' ? 'O escríbenos directamente a' : 'Or email us directly at'}
            </p>
            <a 
              href="mailto:contact@akademo.com"
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              contact@akademo.com
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 sm:px-6 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div>
              <div className="mb-4">
                <span className="font-bold text-white text-lg">AKADEMO</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                {t.footerTagline}
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-white mb-4">{lang === 'es' ? 'Producto' : 'Product'}</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">{lang === 'es' ? 'Características' : 'Features'}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">{lang === 'es' ? 'Seguridad' : 'Security'}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">{lang === 'es' ? 'Precios' : 'Pricing'}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">{lang === 'es' ? 'Casos de uso' : 'Use Cases'}</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-white mb-4">{lang === 'es' ? 'Compañía' : 'Company'}</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">{lang === 'es' ? 'Nosotros' : 'About'}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">{lang === 'es' ? 'Blog' : 'Blog'}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">{lang === 'es' ? 'Contacto' : 'Contact'}</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-white mb-4">{lang === 'es' ? 'Legal' : 'Legal'}</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">{lang === 'es' ? 'Privacidad' : 'Privacy'}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">{lang === 'es' ? 'Términos' : 'Terms'}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">{lang === 'es' ? 'Cookies' : 'Cookies'}</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-gray-500 text-sm">{t.footerRights}</p>
              <div className="flex items-center gap-6">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.896 53.896 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Icons
function SingleSessionIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function DetectionIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function NoDownloadIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  );
}

function TimerIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function WatermarkIcon() {
  return (
    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function TraceIcon() {
  return (
    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function TeacherIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function StudentIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function ClassIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

function RolesIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
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
