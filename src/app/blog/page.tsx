import type { Metadata } from 'next';
import Link from 'next/link';
import { blogPosts } from '@/lib/blog-data';

const ogBlogImage = 'https://akademo-edu.com/api/og?title=Blog%20%E2%80%94%20Recursos%20para%20academias%20online&category=';

export const metadata: Metadata = {
  title: 'Blog | AKADEMO - Recursos para Academias Online',
  description: 'Artículos sobre protección de contenido educativo, gestión de academias online, marcas de agua en vídeos y estrategias para digitalizar tu academia.',
  keywords: ['blog academias online', 'protección contenido educativo', 'gestión académica', 'software para academias'],
  openGraph: {
    title: 'Blog — Recursos para academias online',
    description: 'Artículos sobre protección de contenido educativo, gestión de academias online, marcas de agua en vídeos y estrategias para digitalizar tu academia.',
    url: 'https://akademo-edu.com/blog',
    siteName: 'AKADEMO',
    locale: 'es_ES',
    type: 'website',
    images: [{ url: ogBlogImage, width: 1200, height: 630, alt: 'AKADEMO Blog' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog — Recursos para academias online',
    description: 'Artículos sobre protección de contenido educativo, gestión de academias online, marcas de agua en vídeos y estrategias para digitalizar tu academia.',
    images: [ogBlogImage],
  },
  alternates: {
    canonical: 'https://akademo-edu.com/blog',
  },
};

const categoryColor: Record<string, string> = {
  'Protección': 'text-rose-600',
  'Seguridad': 'text-amber-600',
  'Gestión': 'text-blue-600',
  'Precios': 'text-emerald-600',
  'Crecimiento': 'text-violet-600',
};

export default function BlogPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-32 sm:pt-40 pb-14 sm:pb-20 px-4 sm:px-6 bg-gray-950">
        <div className="max-w-5xl mx-auto">
          <p className="text-sm font-medium text-indigo-400 uppercase tracking-widest mb-4">Blog</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-5">
            Recursos para academias online
          </h1>
          <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
            Artículos sobre gestión de academias, protección de contenido y estrategias para crecer online.
          </p>
        </div>
      </section>

      {/* Articles */}
      <section className="bg-white px-4 sm:px-6 pt-14 pb-20 sm:pb-28">
        <div className="max-w-5xl mx-auto">
          <div className="grid gap-px bg-gray-200 border border-gray-200 rounded-2xl overflow-hidden sm:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block bg-white hover:bg-gray-50 transition-colors duration-150"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.image}
                  alt={post.imageAlt}
                  className="w-full h-40 object-cover"
                  loading="lazy"
                />
                <div className="p-6 sm:p-7">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-semibold uppercase tracking-wide ${categoryColor[post.category] || 'text-gray-500'}`}>
                      {post.category}
                    </span>
                    <span className="text-xs text-gray-400">{post.readTime}</span>
                  </div>
                  <h2 className="text-base font-semibold text-gray-900 group-hover:text-indigo-600 leading-snug mb-2 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-sm text-gray-500 leading-relaxed mb-5 line-clamp-3">
                    {post.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <time className="text-xs text-gray-400" dateTime={post.date}>
                      {new Date(post.date).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </time>
                    <span className="text-xs font-medium text-indigo-600 group-hover:underline">
                      Leer
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-100 bg-gray-50 py-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            ¿Quieres proteger tu academia?
          </h2>
          <p className="text-gray-500 mb-7 leading-relaxed">
            AKADEMO protege tu contenido, gestiona tu equipo y te da las herramientas para crecer.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center px-7 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Solicitar demo gratuita
          </Link>
        </div>
      </section>
    </>
  );
}
