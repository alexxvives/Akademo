import type { Metadata } from 'next';

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  category: string;
  keywords: string[];
  image: string;
  imageAlt: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'como-proteger-contenido-academia-online',
    title: 'Cómo proteger el contenido de tu academia online en 2026',
    description: 'Descubre las mejores estrategias para evitar la piratería de vídeos educativos, proteger tu propiedad intelectual y asegurar los ingresos de tu academia.',
    date: '2026-03-15',
    readTime: '8 min',
    category: 'Protección',
    keywords: ['proteger contenido educativo', 'anti-piratería academia', 'seguridad vídeos online'],
    image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Pantalla de ordenador mostrando código de seguridad digital',
  },
  {
    slug: 'cuentas-compartidas-problema-academias',
    title: 'Cuentas compartidas: el problema silencioso que arruina academias online',
    description: 'El 30% de los accesos a plataformas educativas son de cuentas compartidas. Aprende a detectarlo y solucionarlo sin perder estudiantes.',
    date: '2026-03-10',
    readTime: '6 min',
    category: 'Seguridad',
    keywords: ['cuentas compartidas educación', 'control acceso academia', 'sesiones simultáneas'],
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Múltiples dispositivos conectados representando cuentas compartidas',
  },
  {
    slug: 'guia-digitalizar-academia',
    title: 'Guía completa para digitalizar tu academia en 2026',
    description: 'Paso a paso para llevar tu academia presencial al mundo online: desde la grabación de vídeos hasta la gestión de estudiantes y pagos.',
    date: '2026-03-05',
    readTime: '10 min',
    category: 'Gestión',
    keywords: ['digitalizar academia', 'academia online', 'plataforma educativa', 'software para academias'],
    image: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Persona trabajando en la transformación digital de su negocio',
  },
  {
    slug: 'marca-de-agua-videos-educativos',
    title: 'Marca de agua en vídeos educativos: por qué es esencial para tu academia',
    description: 'Las marcas de agua dinámicas son la herramienta más efectiva contra la piratería educativa. Aprende cómo funcionan y por qué las necesitas.',
    date: '2026-02-28',
    readTime: '7 min',
    category: 'Protección',
    keywords: ['marca de agua vídeos', 'watermark educación', 'protección vídeos academia'],
    image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Grabación de vídeo profesional para contenido educativo',
  },
  {
    slug: 'software-gestion-academias-que-necesitas',
    title: 'Software de gestión para academias: todo lo que necesitas en una plataforma',
    description: 'Comparativa y guía para elegir el mejor software de gestión académica. Profesores, estudiantes, clases, pagos y protección de contenido.',
    date: '2026-02-20',
    readTime: '9 min',
    category: 'Gestión',
    keywords: ['software gestión academias', 'plataforma gestión académica', 'LMS para academias'],
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Dashboard de software de gestión en pantalla de ordenador',
  },
  {
    slug: 'como-fijar-precio-academia-online',
    title: 'Cómo fijar el precio de tu academia online sin dejar dinero en la mesa',
    description: 'La mayoría de academias online cobran demasiado poco. Aprende a estructurar tus precios, elegir el modelo de suscripción adecuado y aumentar el valor percibido de tu oferta.',
    date: '2026-02-12',
    readTime: '8 min',
    category: 'Precios',
    keywords: ['precio academia online', 'modelo suscripción educación', 'tarifa academia', 'cuánto cobrar academia'],
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Calculadora y gráficos de precios sobre un escritorio',
  },
  {
    slug: 'reducir-abandono-estudiantes-academia',
    title: 'Cómo reducir el abandono de estudiantes en tu academia online',
    description: 'La tasa de finalización media en cursos online es menor del 15%. Estas estrategias han demostrado aumentar la retención de estudiantes sin necesidad de bajar precios.',
    date: '2026-02-05',
    readTime: '7 min',
    category: 'Gestión',
    keywords: ['retención estudiantes academia', 'abandono cursos online', 'engagement educativo'],
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Estudiantes participando activamente en una clase',
  },
  {
    slug: 'clases-en-directo-vs-grabadas',
    title: 'Clases en directo vs. grabadas: qué modelo funciona mejor para tu academia',
    description: 'No existe una respuesta única. El modelo que más ingresos genera depende del tipo de contenido, tu audiencia y cómo gestionas el tiempo. Analizamos los dos enfoques.',
    date: '2026-01-28',
    readTime: '6 min',
    category: 'Gestión',
    keywords: ['clases en directo academia', 'clases grabadas vs directo', 'modelo híbrido educación online'],
    image: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Cámara profesional grabando una clase en directo',
  },
  {
    slug: 'errores-comunes-academia-online',
    title: 'Los 5 errores que destruyen academias online en los primeros seis meses',
    description: 'La mayoría de academias que fracasan cometen los mismos errores: lanzar demasiado tarde, subestimar la retención o elegir la plataforma equivocada. Aquí los analizamos uno a uno.',
    date: '2026-01-20',
    readTime: '9 min',
    category: 'Gestión',
    keywords: ['errores academia online', 'fracasar academia online', 'lanzar academia online'],
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Persona planificando estrategia con notas y documentos',
  },
  {
    slug: 'conseguir-primeros-estudiantes-academia',
    title: 'Cómo conseguir tus primeros 100 estudiantes en una academia online',
    description: 'El primer centenar de estudiantes es el más difícil. Estas son las acciones concretas —y el orden correcto para ejecutarlas— que funcionan sin necesidad de grandes presupuestos de marketing.',
    date: '2026-01-10',
    readTime: '10 min',
    category: 'Crecimiento',
    keywords: ['primeros estudiantes academia', 'marketing academia online', 'captar alumnos academia'],
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Grupo de estudiantes trabajando juntos en una academia',
  },
  {
    slug: 'crear-comunidad-estudiantes-academia-online',
    title: 'Cómo crear una comunidad de estudiantes que impulse tu academia online',
    description: 'Una comunidad activa reduce la tasa de abandono un 40% y multiplica el boca a boca. Aprende a construir un espacio donde tus estudiantes se motiven entre sí.',
    date: '2026-03-18',
    readTime: '8 min',
    category: 'Crecimiento',
    keywords: ['comunidad estudiantes online', 'fidelizar alumnos academia', 'engagement comunidad educativa'],
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Grupo de personas conectadas trabajando en comunidad',
  },
  {
    slug: 'seo-academias-online-atraer-estudiantes-google',
    title: 'SEO para academias online: cómo atraer estudiantes desde Google',
    description: 'El 68% de los estudiantes buscan academias en Google antes de inscribirse. Estas son las técnicas de SEO que funcionan específicamente para plataformas educativas.',
    date: '2026-03-19',
    readTime: '9 min',
    category: 'Crecimiento',
    keywords: ['SEO academia online', 'posicionamiento web educación', 'marketing orgánico academia', 'Google para academias'],
    image: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Pantalla mostrando analíticas de tráfico web y SEO',
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find(p => p.slug === slug);
}

export function getBlogMetadata(post: BlogPost): Metadata {
  const ogImage = `https://akademo-edu.com/api/og?title=${encodeURIComponent(post.title)}&category=${encodeURIComponent(post.category)}`;
  return {
    title: `${post.title} | AKADEMO Blog`,
    description: post.description,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: ['AKADEMO'],
      url: `https://akademo-edu.com/blog/${post.slug}`,
      siteName: 'AKADEMO',
      locale: 'es_ES',
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [ogImage],
    },
    alternates: {
      canonical: `https://akademo-edu.com/blog/${post.slug}`,
    },
  };
}
