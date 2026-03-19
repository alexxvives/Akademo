import type { Metadata } from 'next';

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  category: string;
  keywords: string[];
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
  },
  {
    slug: 'cuentas-compartidas-problema-academias',
    title: 'Cuentas compartidas: el problema silencioso que arruina academias online',
    description: 'El 30% de los accesos a plataformas educativas son de cuentas compartidas. Aprende a detectarlo y solucionarlo sin perder estudiantes.',
    date: '2026-03-10',
    readTime: '6 min',
    category: 'Seguridad',
    keywords: ['cuentas compartidas educación', 'control acceso academia', 'sesiones simultáneas'],
  },
  {
    slug: 'guia-digitalizar-academia',
    title: 'Guía completa para digitalizar tu academia en 2026',
    description: 'Paso a paso para llevar tu academia presencial al mundo online: desde la grabación de vídeos hasta la gestión de estudiantes y pagos.',
    date: '2026-03-05',
    readTime: '10 min',
    category: 'Gestión',
    keywords: ['digitalizar academia', 'academia online', 'plataforma educativa', 'software para academias'],
  },
  {
    slug: 'marca-de-agua-videos-educativos',
    title: 'Marca de agua en vídeos educativos: por qué es esencial para tu academia',
    description: 'Las marcas de agua dinámicas son la herramienta más efectiva contra la piratería educativa. Aprende cómo funcionan y por qué las necesitas.',
    date: '2026-02-28',
    readTime: '7 min',
    category: 'Protección',
    keywords: ['marca de agua vídeos', 'watermark educación', 'protección vídeos academia'],
  },
  {
    slug: 'software-gestion-academias-que-necesitas',
    title: 'Software de gestión para academias: todo lo que necesitas en una plataforma',
    description: 'Comparativa y guía para elegir el mejor software de gestión académica. Profesores, estudiantes, clases, pagos y protección de contenido.',
    date: '2026-02-20',
    readTime: '9 min',
    category: 'Gestión',
    keywords: ['software gestión academias', 'plataforma gestión académica', 'LMS para academias'],
  },
  {
    slug: 'como-fijar-precio-academia-online',
    title: 'Cómo fijar el precio de tu academia online sin dejar dinero en la mesa',
    description: 'La mayoría de academias online cobran demasiado poco. Aprende a estructurar tus precios, elegir el modelo de suscripción adecuado y aumentar el valor percibido de tu oferta.',
    date: '2026-02-12',
    readTime: '8 min',
    category: 'Precios',
    keywords: ['precio academia online', 'modelo suscripción educación', 'tarifa academia', 'cuánto cobrar academia'],
  },
  {
    slug: 'reducir-abandono-estudiantes-academia',
    title: 'Cómo reducir el abandono de estudiantes en tu academia online',
    description: 'La tasa de finalización media en cursos online es menor del 15%. Estas estrategias han demostrado aumentar la retención de estudiantes sin necesidad de bajar precios.',
    date: '2026-02-05',
    readTime: '7 min',
    category: 'Gestión',
    keywords: ['retención estudiantes academia', 'abandono cursos online', 'engagement educativo'],
  },
  {
    slug: 'clases-en-directo-vs-grabadas',
    title: 'Clases en directo vs. grabadas: qué modelo funciona mejor para tu academia',
    description: 'No existe una respuesta única. El modelo que más ingresos genera depende del tipo de contenido, tu audiencia y cómo gestionas el tiempo. Analizamos los dos enfoques.',
    date: '2026-01-28',
    readTime: '6 min',
    category: 'Gestión',
    keywords: ['clases en directo academia', 'clases grabadas vs directo', 'modelo híbrido educación online'],
  },
  {
    slug: 'errores-comunes-academia-online',
    title: 'Los 5 errores que destruyen academias online en los primeros seis meses',
    description: 'La mayoría de academias que fracasan cometen los mismos errores: lanzar demasiado tarde, subestimar la retención o elegir la plataforma equivocada. Aquí los analizamos uno a uno.',
    date: '2026-01-20',
    readTime: '9 min',
    category: 'Gestión',
    keywords: ['errores academia online', 'fracasar academia online', 'lanzar academia online'],
  },
  {
    slug: 'conseguir-primeros-estudiantes-academia',
    title: 'Cómo conseguir tus primeros 100 estudiantes en una academia online',
    description: 'El primer centenar de estudiantes es el más difícil. Estas son las acciones concretas —y el orden correcto para ejecutarlas— que funcionan sin necesidad de grandes presupuestos de marketing.',
    date: '2026-01-10',
    readTime: '10 min',
    category: 'Crecimiento',
    keywords: ['primeros estudiantes academia', 'marketing academia online', 'captar alumnos academia'],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find(p => p.slug === slug);
}

export function getBlogMetadata(post: BlogPost): Metadata {
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
    },
    alternates: {
      canonical: `https://akademo-edu.com/blog/${post.slug}`,
    },
  };
}
