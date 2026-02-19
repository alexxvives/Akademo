'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type Lang = 'es' | 'en';

const t = {
  es: {
    nav: { features: 'Características', pricing: 'Precios', login: 'Iniciar Sesión', cta: 'Empieza Gratis' },
    hero: {
      title1: 'Protege tu academia.',
      title2: 'Gestiona tu contenido con control absoluto con',
      titleBrand: 'AKADEMO.',
      subtitle: '',
      cta: 'Solicita una demo',
      perfectFor: 'Perfecto para:',
      audiences: [
        'Academias de formación online que quieren escalar',
        'Centros educativos que buscan protección con tecnología',
        'Fundadores que quieren claridad sin costes de desarrollo',
        'Academias que retienen estudiantes de forma rentable',
      ],
      dashboardLive: 'Live',
    },
    problem: {
      label: 'EL PROBLEMA',
      title1: 'La educación online está',
      titleHighlight: 'rota',
      title2: 'para las academias',
      subtitle: 'Mientras las grandes plataformas tienen equipos enteros de seguridad, tú luchas solo contra la piratería.',
      stats: [
        { value: '€5,000+', title: 'Malgastados en piratería', desc: 'La academia típica pierde miles antes de encontrar una solución. Básicamente estás apostando con tu contenido.' },
        { value: '40+', unit: 'horas', title: 'Perdidas cada mes', desc: 'Gestionando estudiantes, persiguiendo pagos, subiendo contenido. Tiempo que podrías dedicar a enseñar.' },
        { value: '87%', title: 'Se sienten desbordados', desc: 'Hojas de cálculo, plataformas separadas, opciones infinitas. La mayoría no sabe si lo está haciendo bien.' },
      ],
      painPoints: [
        'Rendimiento de contenido en declive',
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
        { icon: 'shield', title: 'Anti-Compartir', desc: 'Una sesión activa por estudiante. Bloqueo automático de cuentas compartidas.' },
        { icon: 'video', title: 'Streaming Seguro', desc: 'Vídeos protegidos sin botón de descarga. Transmisión cifrada.' },
        { icon: 'eye', title: 'Marca de Agua', desc: 'Nombre y email del estudiante visibles en cada vídeo.' },
        { icon: 'chart', title: 'Dashboard', desc: 'Métricas en tiempo real de asistencia, progreso y pagos.' },
        { icon: 'camera', title: 'Clases en Directo', desc: 'Integración Zoom con grabación automática protegida.' },
        { icon: 'clipboard', title: 'Tareas', desc: 'Asigna trabajos, recibe entregas y califica integrado.' },
        { icon: 'creditcard', title: 'Gestión de Pagos', desc: 'Controla quién ha pagado. Bloqueo automático a morosos.' },
        { icon: 'users', title: 'Roles y Permisos', desc: 'Academia, profesores y estudiantes con accesos definidos.' },
        { icon: 'phone', title: 'Mobile-First', desc: 'Funciona perfectamente en móvil, tablet y escritorio.' },
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
      headers: ['Funcionalidad', 'Sin AKADEMO', 'Con AKADEMO', 'Mejora'],
      rows: [
        ['Protección de contenido', '4-6 horas configurando', 'Protegido al instante', '50x más rápido'],
        ['Control de piratería', 'Contratar vigilante (+€500)', 'IA detecta al instante', 'Gratis'],
        ['Gestión de pagos', 'Manual, semanas de retraso', 'Automatizado, tiempo real', 'Siempre al día'],
        ['Análisis de mercado', 'Agencias caras', 'Análisis IA integrado', 'Incluido'],
        ['Multi-plataforma', 'Gestionar cada una por separado', 'Un panel unificado', '3x eficiencia'],
        ['Seguimiento', 'Hojas de cálculo', 'Insights IA en tiempo real', '24/7 monitoreo'],
      ],
      cta: 'Empieza a transformar tu academia',
    },
    product: {
      label: 'LA SOLUCIÓN',
      title1: 'Conoce tu',
      titleHighlight: 'plataforma completa',
      subtitle: 'Todo lo que necesitas para proteger y gestionar tu academia. Sin ser experto en tecnología.',
      items: [
        { badge: 'Protección', icon: 'shield', title: 'Protección Anti-Compartir', desc: 'Tu vigilante de seguridad 24/7. Bloqueo automático de sesiones múltiples y detección de patrones sospechosos.', features: ['Una sesión activa por estudiante', 'Detección de patrones sospechosos', 'Alertas en tiempo real', 'Historial de accesos', 'Bloqueo automático'] },
        { badge: 'Contenido', icon: 'video', title: 'Streaming Protegido', desc: 'Tus vídeos transmitidos con cifrado. Sin descargas. Con marca de agua personalizada.', features: ['Sin botón de descarga', 'Marca de agua dinámica', 'Cifrado de transmisión', 'Control de reproducción', 'Protección anti-grabación'] },
        { badge: 'Gestión', icon: 'chart', title: 'Dashboard Completo', desc: 'Todo en un vistazo: estudiantes, clases, pagos, asistencia, valoraciones.', features: ['Métricas en tiempo real', 'Seguimiento de progreso', 'Gestión de pagos', 'Informes descargables', 'Vista por clase o global'] },
        { badge: 'En Directo', icon: 'camera', title: 'Clases en Directo', desc: 'Transmite en vivo con Zoom integrado. Grabación automática protegida.', features: ['Integración Zoom nativa', 'Grabación automática', 'Protección de grabaciones', 'Estadísticas de asistencia', 'Multi-academia'] },
        { badge: 'Evaluación', icon: 'clipboard', title: 'Tareas y Evaluaciones', desc: 'Asigna, recibe y califica trabajos. Todo integrado sin salir de la plataforma.', features: ['Creación de tareas', 'Entrega de trabajos', 'Sistema de calificación', 'Fechas límite', 'Notificaciones automáticas'] },
        { badge: 'Roles', icon: 'users', title: 'Roles y Permisos', desc: 'Academia, Profesores, Estudiantes. Cada uno ve exactamente lo que necesita.', features: ['Gestión de profesores', 'Inscripciones controladas', 'Permisos granulares', 'Vista por rol', 'Colaboración entre profes'] },
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
      rights: '© 2026 AKADEMO. Todos los derechos reservados.',
      product: 'Producto', company: 'Compañía', legal: 'Legal',
      featuresLink: 'Características', pricingLink: 'Precios',
      contactLink: 'Contacto', privacyLink: 'Privacidad', termsLink: 'Términos',
    },
  },
  en: {
    nav: { features: 'Features', pricing: 'Pricing', login: 'Login', cta: 'Start Free' },
    hero: {
      title1: 'Protect your academy.',
      title2: 'Manage your content with absolute control with',
      titleBrand: 'AKADEMO.',
      subtitle: '',
      cta: 'Request a demo',
      perfectFor: 'Perfect for:',
      audiences: [
        'Online training academies looking to scale',
        'Educational centers seeking tech-powered protection',
        'Founders who want clarity without development costs',
        'Academies retaining students profitably',
      ],
      dashboardLive: 'Live',
    },
    problem: {
      label: 'THE PROBLEM',
      title1: 'Online education is',
      titleHighlight: 'broken',
      title2: 'for academies',
      subtitle: 'While big platforms have entire security teams, you\'re fighting content piracy alone.',
      stats: [
        { value: '€5,000+', title: 'Wasted on piracy', desc: 'The average academy burns through thousands before finding what works. You\'re basically gambling with your content.' },
        { value: '40+', unit: 'hours', title: 'Lost every month', desc: 'Managing students, chasing payments, uploading content. Time you could spend actually teaching.' },
        { value: '87%', title: 'Feel overwhelmed', desc: 'Spreadsheets, separate platforms, endless options. Most founders have no idea if they\'re doing it right.' },
      ],
      painPoints: [
        'Declining content performance',
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
        { icon: 'shield', title: 'Anti-Sharing', desc: 'One active session per student. Automatic blocking of shared accounts.' },
        { icon: 'video', title: 'Secure Streaming', desc: 'Protected videos with no download button. Encrypted transmission.' },
        { icon: 'eye', title: 'Watermark', desc: 'Student name and email visible on every video.' },
        { icon: 'chart', title: 'Dashboard', desc: 'Real-time metrics for attendance, progress and payments.' },
        { icon: 'camera', title: 'Live Classes', desc: 'Zoom integration with automatic protected recording.' },
        { icon: 'clipboard', title: 'Assignments', desc: 'Create, receive and grade assignments all integrated.' },
        { icon: 'creditcard', title: 'Payment Management', desc: 'Track who paid. Auto-block delinquent accounts.' },
        { icon: 'users', title: 'Roles & Permissions', desc: 'Academy, teachers and students with defined access.' },
        { icon: 'phone', title: 'Mobile-First', desc: 'Works perfectly on mobile, tablet and desktop.' },
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
      headers: ['Feature', 'Without AKADEMO', 'With AKADEMO', 'Improvement'],
      rows: [
        ['Content Protection', '4-6 hours configuring', 'Protected instantly', '50x faster'],
        ['Piracy Control', 'Hire watchdog (+€500)', 'AI detects instantly', 'Free'],
        ['Payment Management', 'Manual, weeks behind', 'Automated, real-time', 'Always current'],
        ['Market Analysis', 'Expensive agencies', 'Built-in AI analysis', 'Included'],
        ['Multi-Platform', 'Manage each separately', 'One unified dashboard', '3x efficiency'],
        ['Tracking', 'Spreadsheets & guesswork', 'Real-time AI insights', '24/7 monitoring'],
      ],
      cta: 'Start transforming your academy',
    },
    product: {
      label: 'THE SOLUTION',
      title1: 'Meet your',
      titleHighlight: 'complete platform',
      subtitle: 'Everything you need to protect and manage your academy. No tech expertise required.',
      items: [
        { badge: 'Protection', icon: 'shield', title: 'Anti-Sharing Protection', desc: 'Your 24/7 security guard. Automatic multi-session blocking and suspicious pattern detection.', features: ['One active session per student', 'Suspicious pattern detection', 'Real-time alerts', 'Access history', 'Automatic blocking'] },
        { badge: 'Content', icon: 'video', title: 'Protected Streaming', desc: 'Your videos streamed with encryption. No downloads. With personalized watermark.', features: ['No download button', 'Dynamic watermark', 'Encrypted streaming', 'Playback control', 'Anti-recording protection'] },
        { badge: 'Management', icon: 'chart', title: 'Complete Dashboard', desc: 'Everything at a glance: students, classes, payments, attendance, ratings.', features: ['Real-time metrics', 'Progress tracking', 'Payment management', 'Downloadable reports', 'Per-class or global view'] },
        { badge: 'Live', icon: 'camera', title: 'Live Classes', desc: 'Broadcast live with integrated Zoom. Automatic protected recording.', features: ['Native Zoom integration', 'Automatic recording', 'Recording protection', 'Attendance stats', 'Multi-academy'] },
        { badge: 'Assessment', icon: 'clipboard', title: 'Assignments & Grading', desc: 'Assign, receive and grade work. All integrated without leaving the platform.', features: ['Task creation', 'Work submission', 'Grading system', 'Deadlines', 'Automatic notifications'] },
        { badge: 'Roles', icon: 'users', title: 'Roles & Permissions', desc: 'Academy, Teachers, Students. Each sees exactly what they need.', features: ['Teacher management', 'Controlled enrollments', 'Granular permissions', 'Role-based views', 'Teacher collaboration'] },
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
      rights: '© 2026 AKADEMO. All rights reserved.',
      product: 'Product', company: 'Company', legal: 'Legal',
      featuresLink: 'Features', pricingLink: 'Pricing',
      contactLink: 'Contact', privacyLink: 'Privacy', termsLink: 'Terms',
    },
  },
};

/* ── Reusable tiny SVG icons ── */
function ChevronDown({ className = '' }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
}
function CheckCircle({ className = '' }: { className?: string }) {
  return <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
}
function TrendDown({ className = '' }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>;
}
function XMark({ className = '' }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
}
function ArrowRight({ className = '' }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>;
}
function DollarIcon({ className = '' }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20m5-17a5 5 0 00-5-1c-3 0-5 1.5-5 3.5s2 3 5 3.5 5 1.5 5 3.5-2 3.5-5 3.5a5 5 0 01-5-1" /></svg>;
}
function ClockIcon({ className = '' }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>;
}
function BrainIcon({ className = '' }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2a7 7 0 00-5.2 11.6A5 5 0 009 22h6a5 5 0 002.2-8.4A7 7 0 0012 2zm0 0v4m-4 4h8" /></svg>;
}

/* ── Feature SVG icons (replace emojis) ── */
function ShieldIcon({ className = '' }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>;
}
function VideoIcon({ className = '' }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5c0 .621-.504 1.125-1.125 1.125m1.5 0h12m-12 0c-.621 0-1.125.504-1.125 1.125M18 12H6m12 0c.621 0 1.125.504 1.125 1.125M18 12c-.621 0-1.125.504-1.125 1.125m1.5 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 12c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 7.5h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125M18 16.5h-12" /></svg>;
}
function EyeIcon({ className = '' }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function ChartIcon({ className = '' }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
}
function CameraIcon({ className = '' }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>;
}
function ClipboardIcon({ className = '' }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>;
}
function CreditCardIcon({ className = '' }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>;
}
function UsersIcon({ className = '' }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>;
}
function PhoneIcon({ className = '' }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>;
}

const FEATURE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  shield: ShieldIcon,
  video: VideoIcon,
  eye: EyeIcon,
  chart: ChartIcon,
  camera: CameraIcon,
  clipboard: ClipboardIcon,
  creditcard: CreditCardIcon,
  users: UsersIcon,
  phone: PhoneIcon,
};

const FEATURE_ICON_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#a855f7', // purple
  '#f97316', // orange
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#eab308', // yellow
  '#6366f1', // indigo
  '#f43f5e', // rose
];

export default function FeaturesPage() {
  const [lang, setLang] = useState<Lang>('es');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeCapTab, setActiveCapTab] = useState(0);
  const [calcStudents, setCalcStudents] = useState(50);
  const [calcHours, setCalcHours] = useState(15);
  const [calcToolIdx, setCalcToolIdx] = useState(2);
  const tr = t[lang];

  /* Calculator computed values */
  const toolCosts = [0, 0, 50, 200, 500];
  const hourlyRate = 25;
  const monthlySavings = Math.round(calcHours * 4 * hourlyRate * 0.7 + toolCosts[calcToolIdx] * 0.6 + calcStudents * 0.5);
  const annualSavings = monthlySavings * 12;
  const hoursSaved = Math.round(calcHours * 0.7);
  const roiValue = Math.round((annualSavings / (49 * 12)) * 100);

  return (
    <div className="min-h-screen bg-[#121a2d] text-white antialiased">
      {/* ─── NAVBAR (glass capsule — matches landing page) ─── */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="mt-4 mx-3 sm:mx-auto">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg bg-white/10 border border-white/20">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5">
                <Image src="/logo/AKADEMO_logo_OTHER2.svg" alt="AKADEMO" width={140} height={36} className="h-7 sm:h-8 w-auto brightness-0 invert" />
                <span className="text-lg font-bold tracking-tight font-[family-name:var(--font-montserrat)]">AKADEMO</span>
              </Link>
              <nav className="hidden md:flex items-center gap-8">
                <Link href="/features" className="text-sm font-medium text-white">{tr.nav.features}</Link>
                <Link href="/pricing" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">{tr.nav.pricing}</Link>
              </nav>
              <div className="flex items-center gap-3">
                <Link href="/?modal=login" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:inline">{tr.nav.login}</Link>
                <Link href="/?modal=register" className="px-4 py-2 bg-white text-zinc-900 text-sm font-medium rounded-lg hover:bg-zinc-200 transition-all">
                  {tr.nav.cta}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Fixed language flags (matches landing page positioning) ─── */}
      <div className="fixed top-20 sm:top-6 right-4 sm:right-6 z-50 flex gap-1.5">
        <button
          onClick={() => setLang('es')}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all overflow-hidden shadow-lg ${
            lang === 'es' ? 'bg-white scale-110' : 'bg-white/70 hover:bg-white/90 backdrop-blur'
          }`}
          title="Español"
        >
          <Image src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 600'%3E%3Cpath fill='%23c60b1e' d='M0 0h900v600H0z'/%3E%3Cpath fill='%23ffc400' d='M0 150h900v300H0z'/%3E%3C/svg%3E" alt="ES" width={24} height={24} unoptimized className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <button
          onClick={() => setLang('en')}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all overflow-hidden shadow-lg ${
            lang === 'en' ? 'bg-white scale-110' : 'bg-white/70 hover:bg-white/90 backdrop-blur'
          }`}
          title="English"
        >
          <Image src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 30'%3E%3Cpath fill='%23012169' d='M0 0h60v30H0z'/%3E%3Cpath stroke='%23fff' stroke-width='6' d='M0 0l60 30m0-30L0 30'/%3E%3Cpath stroke='%23C8102E' stroke-width='4' d='M0 0l60 30m0-30L0 30'/%3E%3Cpath stroke='%23fff' stroke-width='10' d='M30 0v30M0 15h60'/%3E%3Cpath stroke='%23C8102E' stroke-width='6' d='M30 0v30M0 15h60'/%3E%3C/svg%3E" alt="EN" width={24} height={24} unoptimized className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* ─── HERO (Growtio style: text left, dashboard image right with floating badges) ─── */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/15 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left: Copy */}
            <div>
              <h1 className="text-[2.14rem] sm:text-[2.85rem] lg:text-[3.56rem] font-bold tracking-tight leading-[1.1] mb-4">
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{tr.hero.title1}</span>
                <br />
                {tr.hero.title2}{' '}
                <span className="relative inline-block">
                  <span className="text-white">{tr.hero.titleBrand}</span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                    <path d="M2 8c30-6 60-6 98-2s70 4 98-2" stroke="url(#underline-grad)" strokeWidth="3" strokeLinecap="round" />
                    <defs><linearGradient id="underline-grad" x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse"><stop stopColor="#34d399" /><stop offset="1" stopColor="#22d3ee" /></linearGradient></defs>
                  </svg>
                </span>
              </h1>
              <p className="text-zinc-400 text-base sm:text-lg max-w-lg mb-8 leading-relaxed">
                {lang === 'es'
                  ? 'El cerebro tecnológico de tu academia que protege, organiza y optimiza tu propiedad intelectual.'
                  : 'The technological brain of your academy that protects, organizes and optimizes your intellectual property.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link href="/?modal=register" className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium rounded-lg hover:from-emerald-400 hover:to-cyan-400 transition-all text-sm sm:text-base text-center shadow-lg shadow-emerald-500/25">
                  {tr.hero.cta}
                </Link>
              </div>
              {/* "Perfect for:" section — matches Growtio exactly */}
              <div>
                <p className="text-sm font-medium text-zinc-400 mb-3">{tr.hero.perfectFor}</p>
                <ul className="space-y-2.5">
                  {tr.hero.audiences.map((a, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-zinc-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right: Dashboard screenshot with floating elements */}
            <div className="relative">
              {/* Gradient glow behind image */}
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-cyan-500/15 to-emerald-500/20 rounded-2xl blur-2xl opacity-60" />
              {/* Main dashboard image */}
              <div className="relative rounded-xl overflow-hidden border border-zinc-800 shadow-2xl shadow-emerald-900/20">
                <Image
                  src="/demo.png"
                  alt="AKADEMO Dashboard"
                  width={800}
                  height={500}
                  className="w-full h-auto"
                  unoptimized
                  priority
                />
                {/* "Live" badge — like Growtio */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 bg-[#1d283a]/80 backdrop-blur-sm border border-zinc-700/50 rounded-full">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-zinc-300">{tr.hero.dashboardLive}</span>
                </div>
              </div>

              {/* Floating metric cards — 4 corners with float animation */}
              <style jsx>{`
                @keyframes float {
                  0%, 100% { transform: translateY(0px); }
                  50% { transform: translateY(-8px); }
                }
                @keyframes painPulse {
                  0%, 100% { transform: scale(1); opacity: 1; }
                  50% { transform: scale(1.2); opacity: 0.7; }
                }
                @keyframes painShake {
                  0%, 90%, 100% { transform: rotate(0deg); }
                  93% { transform: rotate(-8deg); }
                  96% { transform: rotate(8deg); }
                }
              `}</style>

              {/* Top-left: 0% Cuentas compartidas */}
              <div className="absolute -top-4 -left-4 sm:-top-6 sm:-left-6 px-4 py-3 bg-[#1d283a] border border-zinc-700/50 rounded-xl shadow-xl backdrop-blur-sm" style={{ animation: 'float 3s ease-in-out infinite' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded-lg bg-emerald-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">0%</div>
                    <div className="text-[11.5px] text-[#3c4b5e] leading-tight">{lang === 'es' ? 'Cuentas compartidas' : 'Shared accounts'}</div>
                  </div>
                </div>
              </div>

              {/* Top-right: 100% Control */}
              <div className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 px-4 py-3 bg-[#1d283a] border border-zinc-700/50 rounded-xl shadow-xl backdrop-blur-sm" style={{ animation: 'float 3s ease-in-out infinite 0.75s' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded-lg bg-blue-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">100%</div>
                    <div className="text-[11.5px] text-[#3c4b5e] leading-tight">{lang === 'es' ? 'Control total' : 'Total control'}</div>
                  </div>
                </div>
              </div>

              {/* Bottom-left: 24/7 Monitoreo AI */}
              <div className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 px-4 py-3 bg-[#1d283a] border border-zinc-700/50 rounded-xl shadow-xl backdrop-blur-sm" style={{ animation: 'float 3s ease-in-out infinite 1.5s' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded-lg bg-purple-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">24/7</div>
                    <div className="text-[11.5px] text-[#3c4b5e] leading-tight">{lang === 'es' ? 'Monitoreo AI' : 'AI Monitoring'}</div>
                  </div>
                </div>
              </div>

              {/* Bottom-right: 25+ Funcionalidades */}
              <div className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 px-4 py-3 bg-[#1d283a] border border-zinc-700/50 rounded-xl shadow-xl backdrop-blur-sm" style={{ animation: 'float 3s ease-in-out infinite 2.25s' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded-lg bg-orange-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">25+</div>
                    <div className="text-[11.5px] text-[#3c4b5e] leading-tight">{lang === 'es' ? 'Funcionalidades' : 'Features'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PROBLEM SECTION (Growtio exact copy — same layout, same colors) ─── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 relative">
        <div className="max-w-7xl mx-auto">
          {/* Label */}
          <div className="text-center mb-6">
            <span className="inline-block px-3 py-1 text-xs font-semibold tracking-[0.2em] uppercase bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]">{tr.problem.label}</span>
          </div>
          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              {tr.problem.title1}
              <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent"> {tr.problem.titleHighlight} </span>
              {tr.problem.title2}
            </h2>
          </div>
          {/* Subtitle */}
          <p className="text-center text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto mb-16">
            {tr.problem.subtitle}
          </p>

          {/* Stat cards — Growtio style: colored values + icons per card */}
          <div className="grid sm:grid-cols-3 gap-6 mb-14">
            {tr.problem.stats.map((stat, i) => {
              const cardColors = [
                { valueCls: 'text-red-400', iconBg: 'bg-red-500/15', iconColor: 'text-red-400', icon: 'dollar' },
                { valueCls: 'text-yellow-400', iconBg: 'bg-yellow-500/15', iconColor: 'text-yellow-400', icon: 'clock' },
                { valueCls: 'text-purple-400', iconBg: 'bg-purple-500/15', iconColor: 'text-purple-400', icon: 'brain' },
              ][i];
              return (
                <div key={i} className="relative p-8 rounded-2xl bg-[#1d283a] border border-zinc-800 hover:border-zinc-700 transition-all group">
                  {/* Icon top-left */}
                  <div className={`w-10 h-10 rounded-xl ${cardColors.iconBg} flex items-center justify-center mb-6`}>
                    {cardColors.icon === 'dollar' && <DollarIcon className={`w-5 h-5 ${cardColors.iconColor}`} />}
                    {cardColors.icon === 'clock' && <ClockIcon className={`w-5 h-5 ${cardColors.iconColor}`} />}
                    {cardColors.icon === 'brain' && <BrainIcon className={`w-5 h-5 ${cardColors.iconColor}`} />}
                  </div>
                  {/* Value */}
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className={`text-4xl sm:text-5xl font-bold ${cardColors.valueCls}`}>{stat.value}</span>
                    {stat.unit && <span className={`text-2xl sm:text-3xl font-bold ${cardColors.valueCls}`}>{stat.unit}</span>}
                  </div>
                  {/* Title */}
                  <h3 className="text-base font-semibold text-white mb-3">{stat.title}</h3>
                  {/* Desc */}
                  <p className="text-[#8692a6] text-sm leading-relaxed">{stat.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Pain points row + "What if" — Growtio style */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {tr.problem.painPoints.map((point, i) => {
                const painIcons = [
                  <svg key="trend" className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ animation: 'painPulse 2s ease-in-out infinite' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>,
                  <svg key="alert" className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ animation: 'painShake 3s ease-in-out infinite' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
                  <svg key="users" className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ animation: 'painPulse 2.5s ease-in-out infinite 0.5s' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
                ];
                return (
                  <div key={i} className="flex items-center gap-2 px-4 py-2 bg-[#1d283a] border border-zinc-800 rounded-full">
                    {painIcons[i]}
                    <span className="text-sm text-white">{point}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-lg font-medium bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mt-4">
              {tr.problem.solution}
            </p>
          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID ─── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/5 to-transparent" />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 text-zinc-500 text-xs font-semibold tracking-[0.2em] uppercase mb-6">{tr.features.label}</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              {tr.features.title1} <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{tr.features.titleHighlight}</span>
            </h2>
            <p className="text-zinc-400 text-base sm:text-lg max-w-3xl mx-auto">{tr.features.subtitle}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tr.features.list.map((f, i) => (
              <div key={i} className="group p-6 rounded-2xl bg-[#1d283a]/60 border border-zinc-800/80 hover:border-emerald-500/30 hover:bg-[#1d283a] transition-all duration-300">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform" style={{ backgroundColor: FEATURE_ICON_COLORS[i % FEATURE_ICON_COLORS.length] }}>
                  {(() => { const Icon = FEATURE_ICONS[f.icon]; return Icon ? <Icon className="w-7 h-7 text-white" /> : <span className="text-2xl">{f.icon}</span>; })()}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">{f.title}</h3>
                <p className="text-[#8692a6] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BEFORE vs AFTER (Growtio style: table with 4 columns including Improvement) ─── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 text-zinc-500 text-xs font-semibold tracking-[0.2em] uppercase mb-6">{tr.comparison.label}</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              {tr.comparison.title1} <span className="text-red-400">{tr.comparison.titleBefore}</span> {tr.comparison.titleVs} <span className="text-emerald-400">{tr.comparison.titleAfter}</span> {tr.comparison.title2}
            </h2>
            <p className="text-zinc-400 text-base sm:text-lg max-w-3xl mx-auto">{tr.comparison.subtitle}</p>
          </div>
          <div className="rounded-2xl border border-zinc-800/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-[#1d283a]/50">
                    {tr.comparison.headers.map((h, i) => (
                      <th key={i} className={`py-4 px-5 text-left font-semibold text-xs uppercase tracking-wider ${
                        i === 0 ? 'text-zinc-300' : i === 1 ? 'text-red-400' : i === 2 ? 'text-emerald-400' : 'text-zinc-400'
                      }`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tr.comparison.rows.map((row, i) => (
                    <tr key={i} className="border-t border-zinc-800/50 hover:bg-[#1d283a]/30 transition-colors">
                      <td className="py-4 px-5 font-medium text-zinc-200">{row[0]}</td>
                      <td className="py-4 px-5 text-red-400/80">
                        <span className="flex items-center gap-2">
                          <XMark className="w-4 h-4 flex-shrink-0" />
                          {row[1]}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-emerald-400/80">
                        <span className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 flex-shrink-0" />
                          {row[2]}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 text-emerald-400 text-xs font-medium">{row[3]}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="text-center mt-10">
            <Link href="/?modal=register" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-zinc-900 font-medium rounded-lg hover:bg-emerald-400 transition-all text-sm">
              {tr.comparison.cta}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── PRODUCT FEATURES ─── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/5 to-transparent" />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 text-zinc-500 text-xs font-semibold tracking-[0.2em] uppercase mb-6">{tr.product.label}</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              {tr.product.title1} <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{tr.product.titleHighlight}</span>
            </h2>
            <p className="text-zinc-400 text-base sm:text-lg max-w-3xl mx-auto">{tr.product.subtitle}</p>
          </div>
          <div className="space-y-6">
            {/* Hero card */}
            {tr.product.items.slice(0, 1).map((item, i) => (
              <div key={i} className="grid md:grid-cols-2 gap-8 p-8 sm:p-10 rounded-2xl bg-[#1d283a]/60 border border-zinc-800/80 hover:border-emerald-500/30 transition-all">
                <div>
                  <span className="inline-block px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-md mb-4">{item.badge}</span>
                  <div className="w-14 h-14 rounded-xl bg-emerald-500 flex items-center justify-center mb-4">
                    {(() => { const Icon = FEATURE_ICONS[item.icon]; return Icon ? <Icon className="w-7 h-7 text-white" /> : null; })()}
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-6">{item.desc}</p>
                  <ul className="space-y-2.5">
                    {item.features.map((f, fi) => (
                      <li key={fi} className="flex items-center gap-2.5 text-sm text-zinc-300">
                        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-full max-w-sm aspect-square rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-zinc-800/50 flex items-center justify-center">
                    {(() => { const Icon = FEATURE_ICONS[item.icon]; return Icon ? <Icon className="w-32 h-32 text-emerald-500/20" /> : null; })()}
                  </div>
                </div>
              </div>
            ))}
            {/* Grid cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tr.product.items.slice(1).map((item, i) => (
                <div key={i} className="p-6 rounded-2xl bg-[#1d283a]/60 border border-zinc-800/80 hover:border-emerald-500/30 transition-all group">
                  <span className="inline-block px-2 py-0.5 bg-zinc-800/80 text-zinc-400 text-[10px] font-medium rounded-md mb-3 uppercase tracking-wider">{item.badge}</span>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: FEATURE_ICON_COLORS[(i + 1) % FEATURE_ICON_COLORS.length] }}>
                    {(() => { const Icon = FEATURE_ICONS[item.icon]; return Icon ? <Icon className="w-6 h-6 text-white" /> : null; })()}
                  </div>
                  <h3 className="text-base font-semibold mb-2 text-white">{item.title}</h3>
                  <p className="text-[#8692a6] text-xs leading-relaxed mb-4">{item.desc}</p>
                  <ul className="space-y-1.5">
                    {item.features.slice(0, 3).map((f, fi) => (
                      <li key={fi} className="flex items-center gap-2 text-xs text-zinc-400">
                        <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />
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

      {/* ─── FEATURE SHOWCASE (Growtio "Everything you need in one place" style) ─── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/5 to-transparent" />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <span className="inline-block px-3 py-1 text-xs font-semibold tracking-[0.2em] uppercase bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]">
              {lang === 'es' ? 'PANEL DE CONTROL' : 'POWERFUL DASHBOARD'}
            </span>
          </div>
          <h2 className="text-center text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            {lang === 'es' ? 'Todo lo que necesitas en ' : 'Everything you need in '}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              {lang === 'es' ? 'un solo lugar' : 'one place'}
            </span>
          </h2>
          <p className="text-center text-[#8692a6] text-base sm:text-lg max-w-3xl mx-auto mb-16">
            {lang === 'es'
              ? 'Un centro de mando unificado para toda tu academia. Sin cambiar entre plataformas.'
              : 'A unified command center for your entire academy. No more switching between platforms.'}
          </p>

          {/* 2x2 Feature cards with gradient border */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {[
              { icon: 'shield', title: lang === 'es' ? 'Panel Anti-Piratería' : 'Anti-Piracy Dashboard', desc: lang === 'es' ? 'Monitorea y bloquea cuentas compartidas en tiempo real. Control total sobre quién accede.' : 'Monitor and block shared accounts in real time. Total control over who accesses your content.', color: '#10b981' },
              { icon: 'chart', title: lang === 'es' ? 'Gestión de Clases' : 'Class Management', desc: lang === 'es' ? 'Organiza clases, profesores e inscripciones desde un panel unificado.' : 'Organize classes, assign teachers, and manage enrollments from one panel.', color: '#3b82f6' },
              { icon: 'video', title: lang === 'es' ? 'Streaming Protegido' : 'Protected Streaming', desc: lang === 'es' ? 'Vídeos cifrados con marca de agua dinámica. Sin descargas posibles.' : 'Encrypted videos with dynamic watermarks. No downloads possible.', color: '#a855f7' },
              { icon: 'creditcard', title: lang === 'es' ? 'Sistema de Pagos' : 'Payment System', desc: lang === 'es' ? 'Automatiza cobros y detecta morosos al instante.' : 'Automate billing and detect delinquents instantly.', color: '#f97316' },
            ].map((card, i) => {
              const Icon = FEATURE_ICONS[card.icon];
              return (
                <div key={i} className="relative p-6 rounded-2xl bg-[#1d283a] border border-zinc-800/80 hover:border-emerald-500/30 transition-all group overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: card.color }}>
                    {Icon && <Icon className="w-6 h-6 text-white" />}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{card.title}</h3>
                  <p className="text-[#8692a6] text-sm leading-relaxed">{card.desc}</p>
                </div>
              );
            })}
          </div>

          {/* 4 mini icon cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { icon: 'chart', title: lang === 'es' ? 'Analíticas en Tiempo Real' : 'Real-time Analytics', desc: lang === 'es' ? 'Todas las métricas en una vista' : 'All metrics in one view', color: FEATURE_ICON_COLORS[0] },
              { icon: 'shield', title: lang === 'es' ? 'Protección IA' : 'AI Protection', desc: lang === 'es' ? 'Vigilancia 24/7 automatizada' : 'Automated 24/7 surveillance', color: FEATURE_ICON_COLORS[1] },
              { icon: 'eye', title: lang === 'es' ? 'Marca de Agua' : 'Watermark', desc: lang === 'es' ? 'Identificación por estudiante' : 'Per-student identification', color: FEATURE_ICON_COLORS[2] },
              { icon: 'users', title: lang === 'es' ? 'Multi-Rol' : 'Multi-Role', desc: lang === 'es' ? 'Academia, profesor, estudiante' : 'Academy, teacher, student', color: FEATURE_ICON_COLORS[3] },
            ].map((card, i) => {
              const Icon = FEATURE_ICONS[card.icon];
              return (
                <div key={i} className="p-5 rounded-xl bg-[#1d283a]/60 border border-zinc-800/80 hover:border-zinc-700 transition-all">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${card.color}20` }}>
                    {Icon && <span style={{ color: card.color }}><Icon className="w-5 h-5" /></span>}
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">{card.title}</h4>
                  <p className="text-[#8692a6] text-xs">{card.desc}</p>
                </div>
              );
            })}
          </div>

          {/* 4 metric chips */}
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { value: '0%', label: lang === 'es' ? 'Piratería' : 'Piracy', color: 'bg-emerald-500' },
              { value: '100%', label: 'Control', color: 'bg-blue-500' },
              { value: '24/7', label: lang === 'es' ? 'Monitoreo' : 'Monitoring', color: 'bg-purple-500' },
              { value: '25+', label: lang === 'es' ? 'Funcionalidades' : 'Features', color: 'bg-orange-500' },
            ].map((m, i) => (
              <div key={i} className="flex items-center gap-2.5 px-4 py-2.5 bg-[#1d283a] border border-zinc-800/80 rounded-full">
                <div className={`w-8 h-8 rounded-lg ${m.color} flex items-center justify-center`}>
                  <span className="text-xs font-bold text-white">{m.value}</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{m.value}</div>
                  <div className="text-[11px] text-[#3c4b5e]">{m.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PLATFORM CAPABILITIES (Growtio tabbed section style) ─── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <span className="inline-block px-3 py-1 text-zinc-500 text-xs font-semibold tracking-[0.2em] uppercase mb-6">
              {lang === 'es' ? 'CAPACIDADES DE LA PLATAFORMA' : 'PLATFORM CAPABILITIES'}
            </span>
          </div>
          <h2 className="text-center text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            {lang === 'es' ? 'Todo lo que necesitas para ' : 'Everything you need to '}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              {lang === 'es' ? 'dominar la educación online' : 'dominate online education'}
            </span>
          </h2>
          <p className="text-center text-[#8692a6] text-base sm:text-lg max-w-3xl mx-auto mb-12">
            {lang === 'es'
              ? 'Una plataforma para gestionar, proteger y escalar tu academia en todos los canales.'
              : 'One platform to manage, protect, and scale your academy across every channel.'}
          </p>

          {/* Tab buttons */}
          {(() => {
            const capTabs = [
              { icon: 'shield', name: lang === 'es' ? 'Protección' : 'Protection', title: lang === 'es' ? 'Protección de Contenido' : 'Content Protection', desc: lang === 'es' ? 'Blinda tu contenido al instante' : 'Shield your content instantly', features: lang === 'es' ? ['Anti-compartir integrado', 'Marca de agua dinámica', 'Detección de patrones sospechosos', 'Bloqueo automático de sesiones'] : ['Built-in anti-sharing', 'Dynamic watermark', 'Suspicious pattern detection', 'Automatic session blocking'] },
              { icon: 'chart', name: lang === 'es' ? 'Gestión' : 'Management', title: lang === 'es' ? 'Gestión Completa' : 'Complete Management', desc: lang === 'es' ? 'Controla todo desde un panel' : 'Control everything from one panel', features: lang === 'es' ? ['Dashboard en tiempo real', 'Gestión de pagos integrada', 'Seguimiento de progreso', 'Informes descargables'] : ['Real-time dashboard', 'Integrated payment management', 'Progress tracking', 'Downloadable reports'] },
              { icon: 'clipboard', name: lang === 'es' ? 'Evaluación' : 'Assessment', title: lang === 'es' ? 'Evaluación Integral' : 'Complete Assessment', desc: lang === 'es' ? 'Evalúa sin salir de la plataforma' : 'Grade without leaving the platform', features: lang === 'es' ? ['Tareas y entregas', 'Sistema de calificación', 'Fechas límite automáticas', 'Notificaciones de feedback'] : ['Assignments & submissions', 'Grading system', 'Automatic deadlines', 'Feedback notifications'] },
              { icon: 'camera', name: lang === 'es' ? 'En Directo' : 'Live', title: lang === 'es' ? 'Clases en Directo' : 'Live Classes', desc: lang === 'es' ? 'Transmite y graba protegido' : 'Stream and record protected', features: lang === 'es' ? ['Integración Zoom nativa', 'Grabación automática', 'Asistencia en tiempo real', 'Soporte multi-academia'] : ['Native Zoom integration', 'Automatic recording', 'Real-time attendance', 'Multi-academy support'] },
            ];
            const activeTab = capTabs[activeCapTab];
            const TabIcon = FEATURE_ICONS[activeTab.icon];
            return (
              <>
                <div className="flex flex-wrap justify-center gap-3 mb-10">
                  {capTabs.map((tab, i) => {
                    const Icon = FEATURE_ICONS[tab.icon];
                    return (
                      <button key={i} onClick={() => setActiveCapTab(i)} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${activeCapTab === i ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-[#1d283a] text-zinc-400 border border-zinc-800 hover:border-zinc-700'}`}>
                        {Icon && <Icon className="w-4 h-4" />}
                        {tab.name}
                      </button>
                    );
                  })}
                </div>

                {/* Active tab content */}
                <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 p-8 sm:p-10 mb-8">
                  <div className="flex items-center gap-3 mb-2">
                    {TabIcon && <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center"><TabIcon className="w-6 h-6 text-emerald-400" /></div>}
                    <div>
                      <h3 className="text-xl font-bold text-white">{activeTab.title}</h3>
                      <p className="text-emerald-400 text-sm">{activeTab.desc}</p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 mt-6">
                    {activeTab.features.map((feat, fi) => (
                      <div key={fi} className="flex items-center gap-2.5 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <span className="text-sm text-white">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  <Link href="/features" className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors">
                    {lang === 'es' ? 'Explorar Todas las Funcionalidades' : 'Explore All Features'}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </>
            );
          })()}
        </div>
      </section>

      {/* ─── ROI CALCULATOR (Growtio "Calculate your savings" style) ─── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/5 to-transparent" />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold tracking-[0.2em] uppercase bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              {lang === 'es' ? 'CALCULADORA ROI' : 'ROI CALCULATOR'}
            </span>
          </div>
          <h3 className="text-center text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3">
            {lang === 'es' ? 'Calcula tus ahorros en gestión académica' : 'Calculate your academy management savings'}
          </h3>
          <p className="text-center text-[#8692a6] text-base sm:text-lg max-w-2xl mx-auto mb-12">
            {lang === 'es' ? 'Descubre cuánto tiempo y dinero puede ahorrarte AKADEMO' : 'See how much time and money AKADEMO can save your academy'}
          </p>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left: Inputs */}
            <div className="bg-[#1d283a] rounded-2xl p-6 sm:p-8 border border-zinc-800 space-y-8">
              {/* Students slider */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                    <UsersIcon className="w-4 h-4 text-blue-400" />
                    {lang === 'es' ? 'Número de Estudiantes' : 'Number of Students'}
                  </span>
                  <span className="text-lg font-bold text-emerald-400">{calcStudents}</span>
                </div>
                <input type="range" min="10" max="500" step="10" value={calcStudents} onChange={e => setCalcStudents(Number(e.target.value))} className="w-full h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer" />
                <div className="flex justify-between text-xs text-zinc-600 mt-1"><span>10</span><span>500</span></div>
              </div>

              {/* Hours slider */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-yellow-400" />
                    {lang === 'es' ? 'Horas Semanales en Gestión' : 'Weekly Management Hours'}
                  </span>
                  <span className="text-lg font-bold text-emerald-400">{calcHours}h</span>
                </div>
                <input type="range" min="2" max="40" step="1" value={calcHours} onChange={e => setCalcHours(Number(e.target.value))} className="w-full h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer" />
                <div className="flex justify-between text-xs text-zinc-600 mt-1"><span>2h</span><span>40h</span></div>
              </div>

              {/* Current tools */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                    <ChartIcon className="w-4 h-4 text-purple-400" />
                    {lang === 'es' ? 'Herramientas Actuales' : 'Current Tools'}
                  </span>
                  <span className="text-sm text-zinc-500">{lang === 'es' ? 'Est.' : 'Est.'} €{toolCosts[calcToolIdx]}/{lang === 'es' ? 'mes' : 'mo'}</span>
                </div>
                <div className="space-y-2">
                  {(lang === 'es'
                    ? ['Sin herramientas', 'Hojas de cálculo', 'Plataforma básica (~€50/mes)', 'Herramientas premium (~€200/mes)', 'Stack completo (~€500/mes)']
                    : ['No tools', 'Spreadsheets', 'Basic platform (~€50/mo)', 'Premium tools (~€200/mo)', 'Full stack (~€500/mo)']
                  ).map((tool, i) => (
                    <button key={i} onClick={() => setCalcToolIdx(i)} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all ${calcToolIdx === i ? 'bg-emerald-500/15 border border-emerald-500/30 text-white' : 'bg-zinc-800/50 border border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}>
                      {tool}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Results */}
            <div className="space-y-4">
              {/* Annual savings hero */}
              <div className="bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 border border-emerald-500/20 rounded-xl p-6 text-center">
                <p className="text-zinc-400 text-sm mb-1">{lang === 'es' ? 'Ahorro Anual' : 'Annual Savings'}</p>
                <p className="text-4xl sm:text-5xl font-bold text-emerald-400">€{annualSavings.toLocaleString()}</p>
                <p className="text-zinc-500 text-sm mt-1">{lang === 'es' ? 'al año con AKADEMO' : 'per year with AKADEMO'}</p>
              </div>

              {/* 2x2 stats grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1d283a] border border-zinc-800 rounded-xl p-5 text-center">
                  <DollarIcon className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">€{monthlySavings.toLocaleString()}</p>
                  <p className="text-zinc-500 text-xs mt-1">{lang === 'es' ? 'Ahorro Mensual' : 'Monthly Savings'}</p>
                </div>
                <div className="bg-[#1d283a] border border-zinc-800 rounded-xl p-5 text-center">
                  <ClockIcon className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{hoursSaved}h</p>
                  <p className="text-zinc-500 text-xs mt-1">{lang === 'es' ? 'Horas Ahorradas/Mes' : 'Hours Saved/Mo'}</p>
                </div>
                <div className="bg-[#1d283a] border border-zinc-800 rounded-xl p-5 text-center">
                  <ChartIcon className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-emerald-400">{roiValue}%</p>
                  <p className="text-zinc-500 text-xs mt-1">ROI</p>
                </div>
                <div className="bg-[#1d283a] border border-zinc-800 rounded-xl p-5 text-center">
                  <BrainIcon className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">+{Math.round(calcStudents * 0.15)}%</p>
                  <p className="text-zinc-500 text-xs mt-1">{lang === 'es' ? 'Eficiencia' : 'Efficiency'}</p>
                </div>
              </div>

              {/* Savings breakdown */}
              <div className="bg-[#1d283a] border border-zinc-800 rounded-xl p-5">
                <p className="text-sm font-semibold text-zinc-300 mb-3">{lang === 'es' ? 'Desglose de Ahorros' : 'Savings Breakdown'}</p>
                {[
                  { label: lang === 'es' ? 'Consolidación de herramientas' : 'Tool consolidation', value: `+€${Math.round(toolCosts[calcToolIdx] * 0.6)}` },
                  { label: lang === 'es' ? 'Automatización de gestión' : 'Management automation', value: `+€${Math.round(calcHours * 4 * hourlyRate * 0.5)}` },
                  { label: lang === 'es' ? 'Reducción de piratería' : 'Piracy reduction', value: `+€${Math.round(calcStudents * 0.5 * 12)}` },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-zinc-800/50 last:border-0">
                    <span className="text-sm text-zinc-400 flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      {item.label}
                    </span>
                    <span className="text-sm font-medium text-emerald-400">{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Current vs AKADEMO */}
              <div className="bg-[#1d283a] border border-zinc-800 rounded-xl p-5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-zinc-400">{lang === 'es' ? 'Coste mensual actual:' : 'Current monthly cost:'}</span>
                  <span className="text-sm text-zinc-300 line-through">€{Math.round(calcHours * 4 * hourlyRate + toolCosts[calcToolIdx]).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-400">{lang === 'es' ? 'Con AKADEMO:' : 'With AKADEMO:'}</span>
                  <span className="text-lg font-bold text-emerald-400">€49/{lang === 'es' ? 'mes' : 'mo'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">{tr.faq.title}</h2>
            <p className="text-zinc-400 text-sm sm:text-base">{tr.faq.subtitle}</p>
          </div>
          <div className="space-y-2">
            {tr.faq.items.map((faq, i) => (
              <div key={i} className="rounded-xl border border-zinc-800/80 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#1d283a]/30 transition-colors"
                >
                  <span className="font-medium text-zinc-200 text-sm pr-4">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-zinc-500 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-zinc-400 text-sm leading-relaxed border-t border-zinc-800/50">
                    <div className="pt-3">{faq.a}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-10 text-center p-6 rounded-2xl bg-[#1d283a]/60 border border-zinc-800/80">
            <h3 className="font-semibold text-zinc-200 mb-1">{tr.faq.contact.title}</h3>
            <p className="text-zinc-500 text-sm mb-4">{tr.faq.contact.subtitle}</p>
            <a href="mailto:info@akademo.es" className="inline-block px-5 py-2.5 bg-zinc-800 border border-zinc-700 text-white text-sm font-medium rounded-lg hover:bg-zinc-700 transition-all">
              {tr.faq.contact.cta}
            </a>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-900/15 via-transparent to-transparent" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            {tr.cta.title1} <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{tr.cta.titleHighlight}</span>{tr.cta.title2}
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg mb-8 max-w-xl mx-auto">{tr.cta.subtitle}</p>
          <Link href="/?modal=register" className="inline-block px-8 py-3.5 bg-white text-zinc-900 font-medium rounded-lg hover:bg-zinc-200 transition-all text-sm sm:text-base mb-8">
            {tr.cta.button}
          </Link>
          <div className="flex flex-wrap justify-center gap-3">
            {tr.cta.tags.map((tag, i) => (
              <span key={i} className="flex items-center gap-1.5 text-xs text-zinc-500">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-zinc-800/80 py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Image src="/logo/AKADEMO_logo_OTHER2.svg" alt="AKADEMO" width={100} height={28} className="h-6 w-auto brightness-0 invert" />
                <span className="font-bold text-lg">AKADEMO</span>
              </div>
              <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">{tr.footer.tagline}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-zinc-200 mb-4">{tr.footer.product}</h4>
              <ul className="space-y-2.5">
                <li><Link href="/features" className="text-zinc-500 hover:text-white text-sm transition-colors">{tr.footer.featuresLink}</Link></li>
                <li><Link href="/pricing" className="text-zinc-500 hover:text-white text-sm transition-colors">{tr.footer.pricingLink}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-zinc-200 mb-4">{tr.footer.company}</h4>
              <ul className="space-y-2.5">
                <li><a href="mailto:info@akademo.es" className="text-zinc-500 hover:text-white text-sm transition-colors">{tr.footer.contactLink}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-zinc-200 mb-4">{tr.footer.legal}</h4>
              <ul className="space-y-2.5">
                <li><a href="#" className="text-zinc-500 hover:text-white text-sm transition-colors">{tr.footer.privacyLink}</a></li>
                <li><a href="#" className="text-zinc-500 hover:text-white text-sm transition-colors">{tr.footer.termsLink}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-zinc-800/80 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-zinc-600 text-xs">{tr.footer.rights}</p>
            <div className="flex gap-4">
              <Link href="/features" className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">{tr.footer.featuresLink}</Link>
              <Link href="/pricing" className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">{tr.footer.pricingLink}</Link>
              <a href="mailto:info@akademo.es" className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">{tr.footer.contactLink}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
