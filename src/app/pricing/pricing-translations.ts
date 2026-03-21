export type Lang = 'es' | 'en';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://akademo-api.alexxvives.workers.dev';

export const translations = {
  es: {
    nav: { login: 'Iniciar Sesión', getStarted: 'Comenzar' },
    footer: {
      footerTagline:
        'La plataforma de gestión académica diseñada para academias que se toman en serio su negocio.',
    },
    hero: {
      badge: 'Planes a medida',
      title: 'Nos adaptamos a ti',
      subtitle:
        'Cada academia es única. Cuéntanos sobre la tuya y te propondremos el plan que mejor encaja con tu tamaño y necesidades.',
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
      subtitle:
        'Hemos recibido tu información. Nuestro equipo se pondrá en contacto contigo en menos de 24h con una propuesta personalizada.',
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
      testimonial:
        '«Nos ahorra horas cada semana. Antes gestéionabamos todo en Excel; ahora todo está centralizado y los estudiantes no pueden compartir acceso.»',
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
      footerTagline:
        'The academic management platform designed for academies that take their business seriously.',
    },
    hero: {
      badge: 'Custom plans',
      title: 'We adapt to you',
      subtitle:
        "Every academy is unique. Tell us about yours and we'll propose the plan that best fits your size and needs.",
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
      subtitle:
        "We've received your information. Our team will contact you within 24h with a personalized proposal.",
      cta: 'Back to home',
    },
    side: {
      badge: 'Request pricing',
      title: 'We adapt to your needs',
      subtitle: "Tell us about your academy and we'll prepare a tailored plan.",
      bullets: [
        { title: 'Total content protection', desc: 'Secure streaming with BunnyCDN. Your material can never be downloaded or shared.' },
        { title: 'Zero account sharing', desc: 'We detect and block ghost student access in real time.' },
        { title: 'Full management in one place', desc: 'Payments, attendance, assignments and documents from a single dashboard.' },
        { title: 'Priority support', desc: 'Guidance from onboarding until your academy is fully live.' },
      ],
      testimonial:
        '"It saves us hours every week. We used to manage everything in spreadsheets; now it\'s all centralized and students can\'t share access."',
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

export type PricingTranslations = (typeof translations)[Lang];
