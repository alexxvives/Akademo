import type { Metadata } from 'next';
import Link from 'next/link';
import { blogPosts } from '@/lib/blog-data';

export const metadata: Metadata = {
  title: 'Blog | AKADEMO - Recursos para Academias Online',
  description: 'Artículos sobre protección de contenido educativo, gestión de academias online, marcas de agua en vídeos y estrategias para digitalizar tu academia.',
  keywords: ['blog academias online', 'protección contenido educativo', 'gestión académica', 'software para academias'],
  alternates: {
    canonical: 'https://akademo-edu.com/blog',
  },
};

const categoryColors: Record<string, string> = {
  'Protección': 'bg-red-100/80 text-red-300',
  'Seguridad': 'bg-amber-100/80 text-amber-300',
  'Gestión': 'bg-blue-100/80 text-blue-300',
};

const categoryColorsLight: Record<string, string> = {
  'Protección': 'bg-red-100 text-red-700',
  'Seguridad': 'bg-amber-100 text-amber-700',
  'Gestión': 'bg-blue-100 text-blue-700',
};

export default function BlogPage() {
  return (
    <>
      {/* Hero section — dark like landing page hero */}
      <section className="relative pt-32 sm:pt-40 pb-20 sm:pb-28 px-4 sm:px-6 overflow-hidden bg-gray-950">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 via-gray-950 to-gray-950 pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-5">
            Recursos y guías
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight mb-4">
            Blog de AKADEMO
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl leading-relaxed">
            Recursos, guías y estrategias para proteger tu contenido educativo y gestionar tu academia online de forma eficiente.
          </p>

          {/* Featured post — first post highlighted */}
          {blogPosts[0] && (
            <Link
              href={`/blog/${blogPosts[0].slug}`}
              className="group mt-10 block rounded-2xl border border-gray-800 bg-gray-900/60 hover:border-indigo-500/40 hover:bg-gray-900/80 transition-all duration-200 p-6 sm:p-8"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[blogPosts[0].category] || 'bg-gray-800 text-gray-300'}`}>
                  {blogPosts[0].category}
                </span>
                <span className="text-xs text-gray-500">{blogPosts[0].readTime}</span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">Destacado</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white group-hover:text-indigo-300 transition-colors mb-2">
                {blogPosts[0].title}
              </h2>
              <p className="text-gray-400 leading-relaxed mb-3">
                {blogPosts[0].description}
              </p>
              <span className="text-sm font-medium text-indigo-400 group-hover:underline">
                Leer artículo completo →
              </span>
            </Link>
          )}
        </div>
      </section>

      {/* Blog cards grid */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-10">Todos los artículos</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 overflow-hidden"
              >
                <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColorsLight[post.category] || 'bg-gray-100 text-gray-700'}`}>
                      {post.category}
                    </span>
                    <span className="text-xs text-gray-400">{post.readTime}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2 leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">
                    {post.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <time className="text-xs text-gray-400" dateTime={post.date}>
                      {new Date(post.date).toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </time>
                    <span className="text-xs font-medium text-indigo-600 group-hover:underline">
                      Leer más →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            ¿Listo para proteger tu academia?
          </h2>
          <p className="text-gray-600 mb-8 max-w-lg mx-auto">
            AKADEMO te da las herramientas para proteger tu contenido, gestionar tu equipo y hacer crecer tu academia online.
          </p>
          <Link
            href="/?modal=register"
            className="inline-flex items-center px-8 py-3.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25"
          >
            Solicitar Demo Gratuita
          </Link>
        </div>
      </section>
    </>
  );
}
