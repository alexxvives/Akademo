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
